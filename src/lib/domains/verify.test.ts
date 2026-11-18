import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTxtName,
  classifyDnsError,
  evaluateVerification,
  interpretDnsAnswer,
  txtRecordMatches,
  type DnsTxtResult,
  type TxtLookup,
} from "./verify.ts";

/** Lookup falso: devolve o resultado (ou lança, se for Error). */
function lookupOf(result: DnsTxtResult | Error): TxtLookup {
  return async () => {
    if (result instanceof Error) throw result;
    return result;
  };
}

/** Nome exato do desafio. */
describe("buildTxtName", () => {
  it("monta _elicaniverify.<hostname> sem tocar no hostname", () => {
    assert.equal(
      buildTxtName("loja.example.com"),
      "_elicaniverify.loja.example.com",
    );
  });
});

/** Comparação exata do token contra os registros TXT. */
describe("txtRecordMatches", () => {
  const TOKEN = "a".repeat(64);

  it("aceita igualdade exata", () => {
    assert.equal(txtRecordMatches([[TOKEN]], TOKEN), true);
  });

  it("aceita o token contido num valor maior (ex.: elicaniverify=<token>)", () => {
    assert.equal(
      txtRecordMatches([[`elicaniverify=${TOKEN}`]], TOKEN),
      true,
    );
  });

  it("concatena os chunks de um registro (>255 bytes) antes de comparar", () => {
    const head = TOKEN.slice(0, 40);
    const tail = TOKEN.slice(40);
    assert.equal(txtRecordMatches([[head, tail]], TOKEN), true);
  });

  it("recusa valor relacionado mas sem o token", () => {
    assert.equal(
      txtRecordMatches([["google-site-verification=xyz"]], TOKEN),
      false,
    );
  });

  it("recusa outro token (mesmo formato de 64 hex)", () => {
    const other = "b".repeat(64);
    assert.equal(txtRecordMatches([[other]], TOKEN), false);
  });

  it("sensível a caixa: token em maiúsculas não corresponde", () => {
    assert.equal(txtRecordMatches([[TOKEN.toUpperCase()]], TOKEN), false);
  });

  it("qualquer registro entre vários pode casar (ignora os irrelevantes)", () => {
    assert.equal(
      txtRecordMatches([["v=spf1 -all"], [TOKEN], ["outra=coisa"]], TOKEN),
      true,
    );
    assert.equal(
      txtRecordMatches([["v=spf1 -all"], ["outra=coisa"]], TOKEN),
      false,
    );
  });

  it("token vazio nunca casa (defensivo)", () => {
    assert.equal(txtRecordMatches([[""]], ""), false);
    assert.equal(txtRecordMatches([[TOKEN]], ""), false);
  });

  it("lista de registros vazia não casa", () => {
    assert.equal(txtRecordMatches([], TOKEN), false);
  });
});

/** Classificação de erros do resolvedor. */
describe("classifyDnsError", () => {
  it("NXDOMAIN/NODATA → not_found (registro inexistente)", () => {
    assert.equal(classifyDnsError({ code: "ENOTFOUND" }), "not_found");
    assert.equal(classifyDnsError({ code: "ENODATA" }), "not_found");
  });

  it("timeout/servfail/recusa → temporary (retentável)", () => {
    assert.equal(classifyDnsError({ code: "ETIMEOUT" }), "temporary");
    assert.equal(classifyDnsError({ code: "ESERVFAIL" }), "temporary");
    assert.equal(classifyDnsError({ code: "EREFUSED" }), "temporary");
    assert.equal(classifyDnsError({ code: "ECONNREFUSED" }), "temporary");
  });

  it("erro sem código ou desconhecido → temporary (falha em aberto)", () => {
    assert.equal(classifyDnsError(new Error("boom")), "temporary");
    assert.equal(classifyDnsError({ message: "x" }), "temporary");
    assert.equal(classifyDnsError(null), "temporary");
    assert.equal(classifyDnsError("ERRO"), "temporary");
  });
});

/** Resposta vazia do resolvedor = sem registro, não mismatch. */
describe("interpretDnsAnswer", () => {
  it("resposta vazia → not_found", () => {
    assert.deepEqual(interpretDnsAnswer([]), {
      ok: false,
      reason: "not_found",
    });
  });

  it("com registros → ok", () => {
    const records = [["abc"]];
    assert.deepEqual(interpretDnsAnswer(records), { ok: true, records });
  });
});

/** Fluxo completo com lookup injetado (nenhuma rede nos testes). */
describe("evaluateVerification", () => {
  const TOKEN = "c".repeat(64);
  const TXT_NAME = "_elicaniverify.loja.example.com";

  it("TXT exato → sucesso (§14.1)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({ ok: true, records: [[TOKEN]] }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: true });
  });

  it("valores não relacionados → pendente (§14.2)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({ ok: true, records: [["k1=valor"], ["outro"]] }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: false, failure: "txt_mismatch" });
  });

  it("vários TXT, um deles com o token → sucesso (§14.3)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({
        ok: true,
        records: [["v=spf1 -all"], [TOKEN], ["nota=qualquer"]],
      }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: true });
  });

  it("registro ausente → pendente com txt_missing (§14.4)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({ ok: false, reason: "not_found" }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: false, failure: "txt_missing" });
  });

  it("erro temporário de DNS → pendente com dns_unavailable (§14.5)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({ ok: false, reason: "temporary" }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: false, failure: "dns_unavailable" });
  });

  it("token errado → pendente com txt_mismatch (§14.6)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({ ok: true, records: [["d".repeat(64)]] }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: false, failure: "txt_mismatch" });
  });

  it("lookup que lança → dns_unavailable (defensivo, nunca estoura)", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf(new Error("rede caiu")),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: false, failure: "dns_unavailable" });
  });

  it("resposta ok mas sem registros → txt_missing", async () => {
    const outcome = await evaluateVerification({
      lookup: lookupOf({ ok: true, records: [] }),
      txtName: TXT_NAME,
      token: TOKEN,
    });
    assert.deepEqual(outcome, { ok: false, failure: "txt_missing" });
  });

  it("o lookup recebe exatamente o nome do desafio", async () => {
    let seen = "";
    await evaluateVerification({
      lookup: async (name) => {
        seen = name;
        return { ok: false, reason: "not_found" };
      },
      txtName: buildTxtName("shop.example.com"),
      token: TOKEN,
    });
    assert.equal(seen, "_elicaniverify.shop.example.com");
  });
});

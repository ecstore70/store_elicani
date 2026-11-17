import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { en } from "../i18n/messages/en.ts";
import {
  HOSTNAME_LABEL_MAX_LENGTH,
  HOSTNAME_MAX_LENGTH,
  HOSTNAME_MESSAGE_KEYS,
  isPlatformHostname,
  normalizeHostname,
  PLATFORM_BASE_DOMAIN,
  validateHostname,
  type HostnameProblem,
} from "./hostname.ts";

/** Problema estruturado de um input, ou null se aceito. */
function problemOf(input: string): HostnameProblem | null {
  const result = normalizeHostname(input);
  return result.ok ? null : result.problem;
}

/** Hostname normalizado — falha o teste com o problema real se rejeitado. */
function normalized(input: string): string {
  const result = normalizeHostname(input);
  if (!result.ok) {
    assert.fail(`"${input}" deveria ser aceito; veio: ${result.problem}`);
  }
  return result.hostname;
}

const ALL_PROBLEMS: HostnameProblem[] = [
  "empty",
  "protocol",
  "path",
  "ip",
  "port",
  "wildcard",
  "localhost",
  "platform",
  "too_long",
  "invalid",
];

describe("normalizeHostname — normalização", () => {
  it("remove espaços/abas das pontas e caixa mista", () => {
    assert.deepEqual(normalizeHostname("  LojaMaison.COM "), {
      ok: true,
      hostname: "lojamaison.com",
    });
    assert.equal(normalized("\tloja.COM\n"), "loja.com");
  });

  it("remove UM ponto final (forma FQDN)", () => {
    assert.equal(normalized("loja.com."), "loja.com");
    assert.equal(normalized("  LOJA.COM.  "), "loja.com");
    // Dois pontos finais deixam um label vazio → inválido.
    assert.equal(problemOf("loja.com.."), "invalid");
  });

  it("converte IDN (Unicode) para punycode e aceita punycode pronto", () => {
    assert.equal(normalized("Café.com"), "xn--caf-dma.com");
    assert.equal(normalized("münchen.de"), "xn--mnchen-3ya.de");
    assert.equal(normalized("XN--CAF-DMA.COM"), "xn--caf-dma.com");
  });

  it("aceita hostnames válidos usuais sem os alterar", () => {
    for (const host of [
      "loja.com",
      "www.loja.com",
      "shop-minha-loja.co.mz",
      "sub.domina.loja.com",
      "loja24.io",
      "a-b.example.moz",
    ]) {
      assert.equal(normalized(host), host, host);
    }
  });

  it("é idempotente: normalizar o normalizado devolve o mesmo", () => {
    const once = normalized("  CaféMaison.COM. ");
    assert.equal(normalized(once), once);
    assert.equal(normalized(normalized("WWW.Example.COM.")), "www.example.com");
  });
});

describe("normalizeHostname — comprimento (RFC 1035)", () => {
  it("define 253 / 63 como limites", () => {
    assert.equal(HOSTNAME_MAX_LENGTH, 253);
    assert.equal(HOSTNAME_LABEL_MAX_LENGTH, 63);
  });

  it("aceita exatamente 253 caracteres", () => {
    const host = `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`;
    assert.equal(host.length, 253);
    assert.equal(normalized(host), host);
  });

  it("rejeita 254 caracteres", () => {
    const host = `${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`;
    assert.equal(host.length, 254);
    assert.equal(problemOf(host), "too_long");
  });

  it("rejeita label com 64 caracteres", () => {
    assert.equal(problemOf(`${"a".repeat(64)}.com`), "too_long");
  });
});

describe("normalizeHostname — rejeições", () => {
  it("vazio (inclusive só espaços e ponto)", () => {
    for (const input of ["", "   ", ".", " . "]) {
      assert.equal(problemOf(input), "empty", JSON.stringify(input));
    }
  });

  it("protocolo — qualquer esquema com ://", () => {
    for (const input of [
      "https://loja.com",
      "http://loja.com",
      "HTTPS://loja.com",
      "ftp://loja.com",
    ]) {
      assert.equal(problemOf(input), "protocol", input);
    }
    // Com caminho junto: o protocolo é reportado primeiro.
    assert.equal(problemOf("https://loja.com/produtos"), "protocol");
  });

  it("caminho, consulta e fragmento", () => {
    for (const input of [
      "loja.com/produtos",
      "loja.com?cor=preta",
      "loja.com#topo",
      "loja.com/a/b",
    ]) {
      assert.equal(problemOf(input), "path", input);
    }
  });

  it("porta", () => {
    for (const input of ["loja.com:3000", "loja.com:443", "example.com:8080"]) {
      assert.equal(problemOf(input), "port", input);
    }
  });

  it("endereço IP literal (v4 e v6 — antes da regra de porta)", () => {
    for (const input of [
      "192.168.1.1",
      "127.0.0.1",
      "2001:db8::1",
      "[::1]",
      "::1",
      "0:0:0:0:0:ffff:127.0.0.1",
    ]) {
      assert.equal(problemOf(input), "ip", input);
    }
  });

  it("localhost (inclui subdomínios, caixa e ponto final)", () => {
    for (const input of ["localhost", "LOCALHOST", "api.localhost", "localhost."]) {
      assert.equal(problemOf(input), "localhost", input);
    }
  });

  it("curinga", () => {
    for (const input of ["*.loja.com", "*loja.com", "L*JA.COM"]) {
      assert.equal(problemOf(input), "wildcard", input);
    }
  });

  it("hostnames da plataforma (apex + wildcard {slug}.elicani.site)", () => {
    for (const input of [
      "elicani.site",
      "ELICANI.SITE",
      "elicani.site.",
      "app.elicani.site",
      "www.elicani.site",
      "minha-loja.elicani.site",
      "valorfacil.elicani.site",
    ]) {
      assert.equal(problemOf(input), "platform", input);
    }
  });

  it("label único nunca é domínio público registrado", () => {
    for (const input of ["intranet", "meuservidor", "münchen"]) {
      assert.equal(problemOf(input), "invalid", input);
    }
  });

  it("labels inválidos (caracteres e estrutura)", () => {
    for (const input of [
      "under_score.com",
      "-loja.com",
      "loja-.com",
      "loja!.com",
      "a..b.com",
      "loja..com",
      "loja space.com",
      "@loja.com",
      "loja+.com",
      "café!!.com",
    ]) {
      assert.equal(problemOf(input), "invalid", input);
    }
  });
});

describe("isPlatformHostname", () => {
  it("cobre apex, caixa mista, espaços e ponto final", () => {
    for (const host of [
      "elicani.site",
      "ELICANI.SITE",
      " app.elicani.site ",
      "elicani.site.",
      "app.elicani.site",
      "qualquer-coisa.elicani.site",
    ]) {
      assert.ok(isPlatformHostname(host), host);
    }
  });

  it("não confunde parecidos", () => {
    for (const host of [
      "notelicani.site",
      "zelicani.site",
      "loja.com",
      "elicani.site.com",
      "sub.elicani.site.example.com",
    ]) {
      assert.ok(!isPlatformHostname(host), host);
    }
  });

  it(`a base de plataforma é ${PLATFORM_BASE_DOMAIN}`, () => {
    // Se isto mudar, migration do store_domains + CHECK precisam mudar junto.
    assert.equal(PLATFORM_BASE_DOMAIN, "elicani.site");
  });
});

describe("validateHostname (espelho de validateSlug)", () => {
  it("devolve null quando aceito e o problema quando rejeitado", () => {
    assert.equal(validateHostname("Loja.COM"), null);
    assert.equal(validateHostname("café.com"), null);
    assert.equal(validateHostname("https://loja.com"), "protocol");
    assert.equal(validateHostname(""), "empty");
    assert.equal(validateHostname("elicani.site"), "platform");
    assert.equal(validateHostname("localhost"), "localhost");
  });
});

describe("HOSTNAME_MESSAGE_KEYS", () => {
  it("cobre exatamente todos os problemas", () => {
    assert.deepEqual(
      Object.keys(HOSTNAME_MESSAGE_KEYS).sort(),
      [...ALL_PROBLEMS].sort(),
    );
  });

  it("todas as chaves existem no catálogo i18n (en) e são únicas", () => {
    const catalog = new Set(Object.keys(en));
    const seen = new Set<string>();
    for (const problem of ALL_PROBLEMS) {
      const key = HOSTNAME_MESSAGE_KEYS[problem];
      assert.ok(catalog.has(key), `${problem} → "${key}" não está em en.ts`);
      assert.ok(!seen.has(key), `chave duplicada: ${key}`);
      seen.add(key);
    }
  });
});

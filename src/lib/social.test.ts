import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  identifySocialNetwork,
  hostnameOf,
  socialAriaLabel,
  SOCIAL_NETWORK_LABELS,
} from "./social.ts";

describe("identifySocialNetwork — rede oficial a partir da URL", () => {
  it("facebook (apex, www, path e atalho fb.me)", () => {
    assert.equal(identifySocialNetwork("https://facebook.com/example"), "facebook");
    assert.equal(
      identifySocialNetwork("https://www.facebook.com/share/19pMaNChVs/"),
      "facebook",
    );
    assert.equal(identifySocialNetwork("http://fb.me/example"), "facebook");
    assert.equal(
      identifySocialNetwork("https://m.facebook.com/pagina"),
      "facebook",
    );
  });

  it("instagram com www, path, query e trailing slash", () => {
    assert.equal(
      identifySocialNetwork("https://www.instagram.com/myshop/?hl=en"),
      "instagram",
    );
    assert.equal(
      identifySocialNetwork(
        "https://www.instagram.com/elicanishop?cplk=MXMzeDloc2V2OW9hdA==",
      ),
      "instagram",
    );
    assert.equal(identifySocialNetwork("https://instagram.com/loja/"), "instagram");
  });

  it("twitter.com e x.com → X", () => {
    assert.equal(identifySocialNetwork("https://twitter.com/loja"), "x");
    assert.equal(identifySocialNetwork("https://x.com/loja"), "x");
    assert.equal(identifySocialNetwork("https://www.x.com/loja"), "x");
    assert.equal(identifySocialNetwork("https://mobile.twitter.com/loja"), "x");
  });

  it("tiktok, youtube (+ youtu.be) e linkedin", () => {
    assert.equal(identifySocialNetwork("https://tiktok.com/@example"), "tiktok");
    assert.equal(
      identifySocialNetwork("https://www.youtube.com/@example"),
      "youtube",
    );
    assert.equal(identifySocialNetwork("https://youtu.be/abc123"), "youtube");
    assert.equal(
      identifySocialNetwork("https://www.linkedin.com/company/example"),
      "linkedin",
    );
  });

  it("pinterest, threads, snapchat e whatsapp (+ wa.me)", () => {
    assert.equal(
      identifySocialNetwork("https://www.pinterest.com/pin/example/"),
      "pinterest",
    );
    assert.equal(identifySocialNetwork("https://threads.net/@example"), "threads");
    assert.equal(
      identifySocialNetwork("https://www.snapchat.com/add/example"),
      "snapchat",
    );
    assert.equal(
      identifySocialNetwork("https://whatsapp.com/channel/example"),
      "whatsapp",
    );
    assert.equal(identifySocialNetwork("https://wa.me/351912345678"), "whatsapp");
  });

  it("http://, caixa alta e sem www também reconhecem", () => {
    assert.equal(
      identifySocialNetwork("HTTP://WWW.INSTAGRAM.COM/Loja"),
      "instagram",
    );
    assert.equal(identifySocialNetwork("http://youtube.com/@x"), "youtube");
  });

  it("domínio desconhecido, lixo ou vazio → null (fallback neutro)", () => {
    assert.equal(identifySocialNetwork("https://example.com/perfil"), null);
    assert.equal(identifySocialNetwork("https://notinstagram.com"), null);
    assert.equal(identifySocialNetwork("not a url"), null);
    assert.equal(identifySocialNetwork(""), null);
  });
});

describe("socialAriaLabel — rótulo acessível honesto", () => {
  it("rede conhecida usa o nome oficial", () => {
    assert.equal(
      socialAriaLabel("https://www.instagram.com/loja/?hl=en"),
      "Instagram",
    );
    assert.equal(socialAriaLabel("https://x.com/loja"), SOCIAL_NETWORK_LABELS.x);
    assert.equal(socialAriaLabel("https://wa.me/3519"), "WhatsApp");
  });

  it("rede desconhecida usa o hostname — nunca finge ser uma marca", () => {
    assert.equal(socialAriaLabel("https://example.com/perfil"), "example.com");
  });

  it("URL inválida usa a URL crua", () => {
    assert.equal(socialAriaLabel("not a url"), "not a url");
  });
});

describe("hostnameOf", () => {
  it("devolve o hostname normalizado ou null", () => {
    assert.equal(hostnameOf("https://www.Example.com/x?y=1"), "www.example.com");
    assert.equal(hostnameOf("sem url"), null);
    assert.equal(hostnameOf(""), null);
  });
});

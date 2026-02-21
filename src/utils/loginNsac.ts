import * as cheerio from "cheerio";
import { AppError } from "../types/ApiError.js";

interface Tokens {
    xsrf: string;
    nsaconline: string;
    hiddenToken: string;
}

/**
 * Esse codigo foi escrito inicialmente para um bot no discord que eu fiz, eu comentei ele inteiro pra facilitar a leitura
 * considerando que ele é o o principal da API, além do getGrades.ts.
 */

export async function getTokens(): Promise<Tokens> {
    // Isso serve pra capturar os tokens escondidos na pagina de login do NSAC (http://200.145.153.1/nsac).
    // Faz uma request inicial pra pegar o HTML INTEIRO
    const response = await fetch("http://200.145.153.1/nsac", {
        method: "GET",
    });

    // Pego os cookies do header da response (cookie de sessão temporário)
    const cookies = response.headers.getSetCookie().map((value) => value.split(";")[0]) as string[];

    // Se não encontrado, lança uma exceção; isso pode ocorrer se o NSAC mudar algo no site, exigindo uma adaptação no código, 
    // OU se o site estiver desligado (o que pode acontecer depois da meia noite)
    if (cookies.length < 2 || !cookies[0] || !cookies[1]) {
        throw new Error("Tokens de sessão (xsrf ou nsaconline) não encontrados na resposta.");
    }

    // Captura o HTML; o PHP só devolve o HTML inteiro na resposta, no body.
    const html = await response.text();

    // Carrega a árvore do html na ram pelo cheerio.
    const $ = cheerio.load(html);

    // O token escondido EXIGIDO para enviar o email e senha, sem ele o NSAC recusa totalmente.
    const hiddenToken = $('input[name="_token"]').val() as string | undefined; // Se retornar um undefined é pq o site do NSAC explodiu e mudou rota ou sla explodiu mesmo

    if (!hiddenToken) {
        throw new Error("Token hidden (_token) não encontrado no HTML da página.");
    }

    // Cookie pra evitar que o servidor identifique como ataque XSRF. Eles usam a técnica "Double Submit Cookie". Ele é enviado no header
    const xsrf = cookies[0];
    // Cookie de sessão temporário
    const nsaconline = cookies[1];
    return {
        xsrf,
        nsaconline,
        hiddenToken,
    };
}

export async function login(email: string, password: string): Promise<string> {
    // Retorna a string que o NSAC aceita para autenticar direto (Cookie de sessão do PHP) OU lança uma exceção no final.
    const cookies = await getTokens();

    let xsrf = cookies.xsrf;
    let nsaconline = cookies.nsaconline;
    // Essa string é usada pra enviar o email e senha pra pegar o cookie de sessão valido pra eles. Prova que não é ataque XSRF (junto do hidden token)
    let cookiesString = `${xsrf}; ${nsaconline}`;

    const hiddenToken = cookies.hiddenToken;
    const emailEncoded = encodeURIComponent(email);
    const passEncoded = encodeURIComponent(password);
    const authString = `_token=${hiddenToken}&email=${emailEncoded}&password=${passEncoded}`;

    const responseLogin = await fetch("http://200.145.153.1/nsac/login", {
        credentials: "include",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: "http://200.145.153.1/nsac/",
            Cookie: cookiesString,
        },
        body: `${authString}&remember=on`, // Aparentemente ele salva por 5 anos inteiros kkk, ent provavelmente o usuario e senha não serão uteis, mas generalizando totalemente, o melhor é manter, criptografados.
        method: "POST",
        redirect: "manual",
    });
    const newCookies = responseLogin.headers.getSetCookie();

    xsrf = newCookies[0]?.split(";")[0] as string;
    nsaconline = newCookies[1]?.split(";")[0] as string;
    const rememberCookie = newCookies[2]?.split(";")[0] as string;
    const newCookiesString = `${xsrf}; ${nsaconline}; ${rememberCookie}`;

    const responseTest = await fetch("http://200.145.153.1/nsac/home", {
        credentials: "include",
        headers: {
            Cookie: newCookiesString,
        },
        method: "GET",
        redirect: "manual",
    }); // Faz o teste final pra ver se o cookie gerado pelo servidor é válido mesmo, acho que praticamente nunca isso vai falhar, se ele receber os cookies.

    if (responseLogin.status == 302 && responseTest.status == 200) {
        return newCookiesString;
    } else throw new AppError("Wrong NSAC email or password", 401, "INVALID_NSAC_CREDENTIALS");
}

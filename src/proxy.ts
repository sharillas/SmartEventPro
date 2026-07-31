import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/register", "/api/auth/logout"];
const STATIC_EXTS = /\.(ico|png|jpg|jpeg|svg|css|js|woff2?|ttf|eot|webp|avif|xml|txt)$/;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    return new TextEncoder().encode("rentpro-dev-secret-do-not-use-in-production");
  }
  return new TextEncoder().encode(secret);
}

async function verifySession(request: NextRequest) {
  const token = request.cookies.get("rentpro-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (STATIC_EXTS.test(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  return false;
}

const ROLE_API_MAP: Record<string, string[]> = {
  LOGISTICA: ["/api/equipamentos", "/api/reparacoes", "/api/transportes", "/api/veiculos", "/api/notas-encomenda", "/api/stock/movimentos", "/api/categorias"],
  COMERCIAL: ["/api/clientes", "/api/orcamentos", "/api/projetos", "/api/servicos", "/api/notas-encomenda", "/api/faturas"],
  FINANCEIRO: ["/api/faturas", "/api/notas-encomenda"],
  RH: ["/api/colaboradores", "/api/departamentos", "/api/funcoes", "/api/epis", "/api/certificacoes", "/api/contratos"],
  TECNICO: ["/api/timesheets", "/api/absences", "/api/colaboradores", "/api/projetos"],
};

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/dashboard", "/api/company-info", "/api/upload"];

function canAccessApi(role: string, pathname: string) {
  if (role === "ADMIN") return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  const allowedPaths = ROLE_API_MAP[role] || [];
  return allowedPaths.some((prefix) => pathname.startsWith(prefix));
}

function canAccessPage(role: string, pathname: string) {
  if (pathname === "/") return true;
  if (role === "ADMIN") return true;
  if (role === "TECNICO") return pathname.startsWith("/api/");
  const group = Object.entries(ROLE_API_MAP).find(([r]) => r === role);
  if (!group) return false;
  return group[1].some((prefix) => {
    const pagePath = prefix.replace("/api/", "/");
    const segment = "/" + pagePath.split("/").pop();
    return pathname.startsWith(prefix) || pathname === pagePath || pathname.startsWith(pagePath + "/") || pathname.startsWith(pagePath + "-") || pathname.endsWith(segment) || pathname.includes(segment + "/");
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = await verifySession(request);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/api/") && !canAccessApi(session.role, pathname)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (!pathname.startsWith("/api/") && pathname !== "/" && !canAccessPage(session.role, pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

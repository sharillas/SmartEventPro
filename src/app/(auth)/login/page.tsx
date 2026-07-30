"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Erro ao iniciar sessão.");
      setLoading(false);
      return;
    }

    toast.success("Sessão iniciada com sucesso.");
    window.location.href = "/";
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Erro ao registar.");
      setLoading(false);
      return;
    }

    toast.success("Conta criada com sucesso.");
    window.location.href = "/";
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <img src="/images/logo1.svg" alt="SmartEvent" className="h-16 w-16 mx-auto mb-3" />
        <CardTitle className="text-2xl font-bold">SmartEventManager</CardTitle>
        <CardDescription>Gestão de Aluguer de Equipamentos para Eventos</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Registar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" placeholder="email@exemplo.pt" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input id="login-password" name="password" type="password" placeholder="••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "A entrar..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Nome</Label>
                <Input id="reg-name" name="name" placeholder="O seu nome" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input id="reg-email" name="email" type="email" placeholder="email@exemplo.pt" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Senha</Label>
                <Input id="reg-password" name="password" type="password" placeholder="••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "A criar conta..." : "Criar Conta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

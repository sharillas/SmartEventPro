"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings, Building2, Users } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  TECNICO: "Técnico",
  CONSULTA: "Consulta",
};

export default function DefinicoesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState({
    name: "",
    address: "",
    postal: "",
    phone: "",
    email: "",
    nif: "",
    website: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);

  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("Failed");
        const userData = await userRes.json();
        setUser(userData.user || userData);
        setUsername(userData.user?.name || userData.name || "");

        const compRes = await fetch("/api/company-info");
        if (compRes.ok) {
          const compData = await compRes.json();
          setCompany({
            name: compData.name || "",
            address: compData.address || "",
            postal: compData.postal || "",
            phone: compData.phone || "",
            email: compData.email || "",
            nif: compData.nif || "",
            website: compData.website || "",
          });
        }

        if (userData.user?.role === "ADMIN") {
          setLoadingUsers(true);
          const usersRes = await fetch("/api/auth/users");
          if (usersRes.ok) {
            setUsers(await usersRes.json());
          }
          setLoadingUsers(false);
        }
      } catch {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveCompany() {
    setSavingCompany(true);
    try {
      const res = await fetch("/api/company-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Dados da empresa atualizados.");
    } catch {
      toast.error("Erro ao guardar dados da empresa.");
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleUpdateProfile() {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }
    setSavingProfile(true);
    try {
      const body: Record<string, string> = { name: username };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.password = newPassword;
      }
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Perfil atualizado.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Definições</h1>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">
            <Building2 className="h-4 w-4 mr-1" /> Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="utilizadores">
            <Users className="h-4 w-4 mr-1" /> Utilizadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" /> Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comp-name">Nome</Label>
                  <Input
                    id="comp-name"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-nif">NIF</Label>
                  <Input
                    id="comp-nif"
                    value={company.nif}
                    onChange={(e) => setCompany({ ...company, nif: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-address">Morada</Label>
                  <Input
                    id="comp-address"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-postal">Código Postal / Localidade</Label>
                  <Input
                    id="comp-postal"
                    value={company.postal}
                    onChange={(e) => setCompany({ ...company, postal: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-phone">Telefone</Label>
                  <Input
                    id="comp-phone"
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-email">Email</Label>
                  <Input
                    id="comp-email"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-website">Website</Label>
                  <Input
                    id="comp-website"
                    value={company.website}
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveCompany} disabled={savingCompany}>
                {savingCompany ? "A guardar..." : "Guardar Dados da Empresa"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilizadores" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" /> Perfil de Utilizador
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="def-email">Email</Label>
                <Input id="def-email" value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="def-name">Nome</Label>
                <Input
                  id="def-name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="def-current-pw">Palavra-passe Atual</Label>
                <Input
                  id="def-current-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="def-new-pw">Nova Palavra-passe</Label>
                <Input
                  id="def-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="def-confirm-pw">Confirmar Palavra-passe</Label>
                <Input
                  id="def-confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={savingProfile}>
                {savingProfile ? "A guardar..." : "Alterar Senha"}
              </Button>
            </CardContent>
          </Card>

          {user?.role === "ADMIN" && (
            <Card>
              <CardHeader>
                <CardTitle>Todos os Utilizadores</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-muted-foreground text-center py-4">A carregar...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum utilizador encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{roleLabel[u.role] || u.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={u.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                                {u.active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

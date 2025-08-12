import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserMinus, 
  Search,
  Edit,
  Trash2,
  Crown,
  User as UserIcon,
  Building,
  Calendar,
  BarChart3,
  Home,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { AdminDashboard } from "@/components/AdminDashboard";

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").refine(email => email.endsWith('@nextest.com.br'), {
    message: 'Email deve ser do domínio @nextest.com.br'
  }),
  department: z.string().min(1, "Departamento é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
  role: z.enum(["user", "admin"]).default("user"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar se o usuário é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-3xl p-8 text-center">
          <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-nextest-dark mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você não tem privilégios de administrador para acessar esta página.</p>
          <Link href="/">
            <Button className="gradient-button text-white">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Buscar dados administrativos
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: stats = {}, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: releases = [], isLoading: isLoadingReleases } = useQuery({
    queryKey: ["/api/admin/tutorial-releases"],
  });

  const { data: tutorials = [] } = useQuery({
    queryKey: ["/api/tutorials"],
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar usuário");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!",
      });
      setIsCreateUserOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar usuário");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao deletar usuário");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover usuário",
        variant: "destructive",
      });
    },
  });

  // Form para criar usuário
  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  const onSubmit = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  const toggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { isActive: !currentStatus },
    });
  };

  const toggleUserRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateUserMutation.mutate({
      id: userId,
      updates: { role: newRole },
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter((u: User) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isLoadingUsers || isLoadingStats || isLoadingReleases;

  if (isLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-3xl p-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600 text-center">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation Header */}
      <nav className="glass-effect border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Crown className="h-8 w-8 text-yellow-500" />
              <h1 className="text-xl font-semibold text-nextest-dark">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gerenciar Usuários
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard 
              stats={stats}
              users={users}
              releases={releases}
              tutorials={tutorials}
            />
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              {/* Header com botão de criar usuário */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-nextest-dark">Gerenciar Usuários</h2>
                  <p className="text-gray-600">Adicione, edite e gerencie usuários do sistema</p>
                </div>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-button text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Adicione um novo usuário ao sistema
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Departamento</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Papel</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o papel" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">Usuário</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirmar Senha</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateUserOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={createUserMutation.isPending}
                            className="gradient-button text-white"
                          >
                            {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuários por nome, email ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50"
                />
              </div>

              {/* Users Table */}
              <Card className="glass-card border-white/20">
                <CardHeader>
                  <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u: User) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.department}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={u.role === 'admin' ? 'default' : 'secondary'}
                              className={u.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : ''}
                            >
                              {u.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.isActive ? 'default' : 'destructive'}>
                              {u.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserRole(u.id, u.role)}
                                disabled={u.id === user?.id}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleUserStatus(u.id, u.isActive)}
                                disabled={u.id === user?.id}
                              >
                                {u.isActive ? <UserMinus className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === user?.id}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle>Analytics Avançados</CardTitle>
                <CardDescription>
                  Análises detalhadas e métricas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Funcionalidade de analytics em desenvolvimento. 
                  Em breve teremos gráficos detalhados de uso, tendências e relatórios avançados.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
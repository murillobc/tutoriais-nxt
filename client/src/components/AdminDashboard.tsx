import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Building, 
  Calendar,
  Download,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  UserCheck,
  Shield
} from "lucide-react";
import { formatCpf, formatCnpj } from "@/lib/formatters";

interface AdminDashboardProps {
  stats: any;
  users: any[];
  releases: any[];
  tutorials: any[];
}

export function AdminDashboard({ stats, users, releases, tutorials }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [tutorialFilter, setTutorialFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filtrar releases com base nos critérios
  const filteredReleases = releases.filter(release => {
    const matchesSearch = 
      release.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.clientCpf.includes(searchTerm);

    const matchesUser = userFilter === "all" || release.userId === userFilter;
    const matchesCompany = companyFilter === "all" || release.companyName === companyFilter;
    const matchesStatus = statusFilter === "all" || release.status === statusFilter;
    
    const matchesTutorial = tutorialFilter === "all" || 
      (Array.isArray(release.tutorialIds) && release.tutorialIds.includes(tutorialFilter));

    return matchesSearch && matchesUser && matchesCompany && matchesStatus && matchesTutorial;
  });

  // Listas únicas para filtros
  const uniqueCompanies = Array.from(new Set(releases.map(r => r.companyName)));
  const uniqueStatuses = Array.from(new Set(releases.map(r => r.status)));

  // Dados para gráficos
  const releasesPerMonth = releases.reduce((acc, release) => {
    const month = new Date(release.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const releasesPerUser = releases.reduce((acc, release) => {
    const userName = release.user?.name || 'Usuário não identificado';
    acc[userName] = (acc[userName] || 0) + 1;
    return acc;
  }, {});

  const releasesPerCompany = releases.reduce((acc, release) => {
    acc[release.companyName] = (acc[release.companyName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-nextest-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nextest-dark">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAdmins} administradores
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liberações</CardTitle>
            <BarChart3 className="h-4 w-4 text-nextest-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nextest-dark">{stats.totalReleases}</div>
            <p className="text-xs text-muted-foreground">
              {stats.releasesThisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Atendidas</CardTitle>
            <Building className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nextest-dark">{uniqueCompanies.length}</div>
            <p className="text-xs text-muted-foreground">
              Empresas únicas
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tutoriais Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-nextest-dark">{tutorials.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {uniqueCompanies.map(company => (
                  <SelectItem key={company} value={company}>{company}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tutorialFilter} onValueChange={setTutorialFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tutorial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tutoriais</SelectItem>
                {tutorials.map(tutorial => (
                  <SelectItem key={tutorial.id} value={tutorial.id}>{tutorial.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Liberações Filtradas */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liberações de Tutoriais ({filteredReleases.length})</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Filtrados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">CPF</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">CNPJ</th>
                  <th className="text-left p-2">Responsável</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredReleases.map(release => (
                  <tr key={release.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2 font-medium">{release.clientName}</td>
                    <td className="p-2 text-gray-600">{formatCpf(release.clientCpf)}</td>
                    <td className="p-2">{release.companyName}</td>
                    <td className="p-2 text-gray-600">{formatCnpj(release.companyDocument)}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        {release.user?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={release.status === 'Sucesso' ? 'default' : 'secondary'}
                        className={release.status === 'Sucesso' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {release.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-gray-600">
                      {new Date(release.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights e Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle>Top 5 Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(releasesPerCompany)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([company, count]) => (
                  <div key={company} className="flex justify-between items-center">
                    <span className="text-sm">{company}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle>Produtividade por Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(releasesPerUser)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([user, count]) => (
                  <div key={user} className="flex justify-between items-center">
                    <span className="text-sm">{user}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
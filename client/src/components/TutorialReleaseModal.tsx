import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X, User, Building, PlayCircle, Search, Check, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InputMask } from "@/components/ui/input-mask";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DynamicSelectContent } from "@/components/DynamicSelectContent";


const tutorialReleaseSchema = z.object({
  clientName: z.string().min(1, "Nome é obrigatório"),
  clientCpf: z.string().min(11, "CPF é obrigatório"),
  clientEmail: z.string().email("Email inválido"),
  clientPhone: z.string().optional(),
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  companyDocument: z.string().min(14, "CNPJ é obrigatório"),
  companyRole: z.string().min(1, "Cargo é obrigatório"),
  tutorialIds: z.array(z.string()).min(1, "Selecione pelo menos um tutorial"),
});

type TutorialReleaseForm = z.infer<typeof tutorialReleaseSchema>;

interface Tutorial {
  id: string;
  name: string;
  description: string;
  tag: string;
  idCademi: number;
}

interface TutorialReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialReleaseModal({ isOpen, onClose }: TutorialReleaseModalProps) {
  const [selectedTutorials, setSelectedTutorials] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TutorialReleaseForm>({
    resolver: zodResolver(tutorialReleaseSchema),
    defaultValues: {
      clientName: "",
      clientCpf: "",
      clientEmail: "",
      clientPhone: "",
      companyName: "",
      companyDocument: "",
      companyRole: "",
      tutorialIds: [],
    },
  });

  const { data: tutorials = [] } = useQuery<Tutorial[]>({
    queryKey: ["/api/tutorials"],
    enabled: isOpen,
  });

  const createReleaseMutation = useMutation({
    mutationFn: (data: TutorialReleaseForm) =>
      apiRequest("POST", "/api/tutorial-releases", data),
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Tutoriais liberados com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tutorial-releases"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao liberar tutoriais",
        variant: "destructive",
      });
    },
  });

  const filteredTutorials = tutorials.filter(
    tutorial =>
      tutorial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorial.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleTutorial = (tutorialId: string) => {
    const newSelection = selectedTutorials.includes(tutorialId)
      ? selectedTutorials.filter(id => id !== tutorialId)
      : [...selectedTutorials, tutorialId];

    setSelectedTutorials(newSelection);
    form.setValue("tutorialIds", newSelection);
  };

  const handleClose = () => {
    form.reset();
    setSelectedTutorials([]);
    setSearchTerm("");
    onClose();
  };

  const onSubmit = (data: TutorialReleaseForm) => {
    createReleaseMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-effect rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-nextest-dark">Nova Liberação de Tutorial</h2>
            <p className="text-gray-600 text-sm">Preencha os dados para liberar o acesso aos tutoriais</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Data Section */}
            <div className="form-section">
              <h3 className="text-lg font-semibold text-nextest-dark mb-4 flex items-center">
                <User className="mr-3 h-5 w-5 text-nextest-blue" />
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome Completo *</Label>
                  <Input
                    id="clientName"
                    placeholder="Digite o nome completo"
                    {...form.register("clientName")}
                    data-testid="input-client-name"
                  />
                  {form.formState.errors.clientName && (
                    <p className="text-sm text-red-500">{form.formState.errors.clientName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientCpf">CPF *</Label>
                  <InputMask
                    id="clientCpf"
                    mask="cpf"
                    placeholder="000.000.000-00"
                    {...form.register("clientCpf")}
                    data-testid="input-client-cpf"
                  />
                  {form.formState.errors.clientCpf && (
                    <p className="text-sm text-red-500">{form.formState.errors.clientCpf.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="email@empresa.com"
                    {...form.register("clientEmail")}
                    data-testid="input-client-email"
                  />
                  {form.formState.errors.clientEmail && (
                    <p className="text-sm text-red-500">{form.formState.errors.clientEmail.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Telefone</Label>
                  <InputMask
                    id="clientPhone"
                    mask="phone"
                    placeholder="(11) 99999-9999"
                    {...form.register("clientPhone")}
                    data-testid="input-client-phone"
                  />
                </div>
              </div>
            </div>

            {/* Company Data Section */}
            <div className="form-section">
              <h3 className="text-lg font-semibold text-nextest-dark mb-4 flex items-center">
                <Building className="mr-3 h-5 w-5 text-nextest-blue" />
                Dados da Empresa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Empresa *</Label>
                  <Input
                    id="companyName"
                    placeholder="Nome da empresa"
                    {...form.register("companyName")}
                    data-testid="input-company-name"
                  />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDocument">CNPJ *</Label>
                  <InputMask
                    id="companyDocument"
                    mask="cnpj"
                    placeholder="00.000.000/0000-00"
                    {...form.register("companyDocument")}
                    data-testid="input-company-document"
                  />
                  {form.formState.errors.companyDocument && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyDocument.message}</p>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyRole">Cargo *</Label>
                  <Select
                    onValueChange={(value) => form.setValue("companyRole", value)}
                    defaultValue={form.getValues("companyRole")}
                  >
                    <SelectTrigger className="w-full" data-testid="select-company-role">
                      <SelectValue placeholder="Selecione um cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engenheiro">Engenheiro</SelectItem>
                      <SelectItem value="Desenvolvedor">Desenvolvedor</SelectItem>
                      <SelectItem value="Gerente">Gerente</SelectItem>
                      <SelectItem value="Analista">Analista</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.companyRole && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyRole.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tutorial Selection Section */}
            <div className="form-section">
              <h3 className="text-lg font-semibold text-nextest-dark mb-4 flex items-center">
                <PlayCircle className="mr-3 h-5 w-5 text-nextest-blue" />
                Seleção de Tutoriais
              </h3>
              <div className="mb-4 flex items-center gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Buscar tutoriais..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tutorial"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                {filteredTutorials.map((tutorial) => (
                  <div
                    key={tutorial.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedTutorials.includes(tutorial.id)
                        ? "border-nextest-blue bg-nextest-blue/10"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => toggleTutorial(tutorial.id)}
                    data-testid={`tutorial-item-${tutorial.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-nextest-dark">{tutorial.name}</h4>
                      {selectedTutorials.includes(tutorial.id) && (
                        <Check className="h-5 w-5 text-nextest-blue" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{tutorial.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Tag: {tutorial.tag}</p>
                  </div>
                ))}
              </div>
              {form.formState.errors.tutorialIds && (
                <p className="text-sm text-red-500 mt-2">{form.formState.errors.tutorialIds.message}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-release"
              >
                Cancelar
              </Button>
              <Button type="submit" data-testid="button-confirm-release" disabled={createReleaseMutation.isPending}>
                {createReleaseMutation.isPending ? "Liberando..." : "Liberar Tutoriais"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
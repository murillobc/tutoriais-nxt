import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  situacao?: string;
  atividade_principal?: string;
  endereco_completo?: string;
  data_abertura?: string;
  porte?: string;
}

interface CompanySearchResult {
  found: boolean;
  company?: CompanyData;
  source?: string;
  message?: string;
  error?: string;
  attempts?: any[];
}

export function usePublicCnpjAPI() {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchCompany = async (cnpj: string): Promise<CompanyData | null> => {
    if (!cnpj || cnpj.replace(/\D/g, '').length !== 14) {
      return null;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/companies/search?cnpj=${encodeURIComponent(cnpj)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as CompanySearchResult;
      
      if (result.found && result.company) {
        toast({
          title: "Empresa encontrada!",
          description: `${result.company.name} encontrada via ${result.source || 'API pública'}`,
        });
        return result.company;
      } else {
        toast({
          title: "Empresa não encontrada",
          description: result.message || "CNPJ não encontrado nas bases públicas",
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      console.error('Erro ao buscar empresa:', error);
      toast({
        title: "Erro na busca",
        description: error.message || "Erro ao consultar APIs públicas",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return { searchCompany, isSearching };
}
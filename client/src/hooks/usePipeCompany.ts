import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  name: string;
  document: string;
  email?: string;
  phone?: string;
}

interface CompanySearchResult {
  found: boolean;
  company?: CompanyData;
  message?: string;
  error?: string;
}

export function usePipeCompany() {
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
          description: `${result.company.name} foi encontrada no CRM`,
        });
        return result.company;
      } else {
        toast({
          title: "Empresa não encontrada",
          description: "CNPJ não encontrado no Pipe CRM",
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      console.error('Erro ao buscar empresa:', error);
      toast({
        title: "Erro na busca",
        description: error.message || "Erro ao consultar o CRM",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return { searchCompany, isSearching };
}
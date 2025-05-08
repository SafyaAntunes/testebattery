
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { LogoutProps } from "@/types/props";
import { useAuth } from "@/hooks/useAuth";
import { SubAtividade } from "@/types/ordens";
import { useOrdemDetalhes } from "@/hooks/useOrdemDetalhes";
import OrdemForm from "@/components/ordens/OrdemForm";
import { OrdemTabs } from "@/components/ordens/detalhes/OrdemTabs";
import { DeleteOrdemDialog } from "@/components/ordens/detalhes/DeleteOrdemDialog";
import { LoadingOrdem } from "@/components/ordens/detalhes/LoadingOrdem";
import { NotFoundOrdem } from "@/components/ordens/detalhes/NotFoundOrdem";
import { OrdemHeaderCustom } from "@/components/ordens/detalhes/OrdemHeaderCustom";
import { useState, useEffect } from "react";
import { Cliente } from "@/types/clientes";
import { toast } from "sonner";
import { loadOrderFormData } from "@/services/ordemService";

interface OrdemDetalhesProps extends LogoutProps {}

export default function OrdemDetalhes({ onLogout }: OrdemDetalhesProps) {
  const { id } = useParams();
  const { funcionario, canEditOrder } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  
  const {
    ordem,
    isLoading,
    isSubmitting,
    activeTab,
    isEditando,
    deleteDialogOpen,
    setActiveTab,
    setIsEditando,
    setDeleteDialogOpen,
    handleOrdemUpdate,
    handleSubmit,
    handleDelete,
    handleStatusChange,
  } = useOrdemDetalhes(id);

  const canEditThisOrder = ordem ? canEditOrder(ordem.id) : false;
  
  // Carregar clientes quando entrar no modo de edição
  useEffect(() => {
    if (isEditando) {
      const fetchClientes = async () => {
        setIsLoadingClientes(true);
        try {
          const { clientes } = await loadOrderFormData();
          setClientes(clientes);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          toast.error("Erro ao carregar lista de clientes");
        } finally {
          setIsLoadingClientes(false);
        }
      };
      
      fetchClientes();
    }
  }, [isEditando]);

  if (isLoading) {
    return (
      <Layout>
        <LoadingOrdem />
      </Layout>
    );
  }
  
  if (!ordem) {
    return (
      <Layout>
        <NotFoundOrdem />
      </Layout>
    );
  }

  // Função para lidar com toggles de subatividades durante a edição da ordem
  const handleSubatividadeToggleInEditMode = (servicoTipo: string, subId: string, checked: boolean) => {
    if (!ordem || !isEditando) return;
    
    const servicosAtualizados = ordem.servicos.map(servico => {
      if (servico.tipo === servicoTipo) {
        const subatividadesAtualizadas = servico.subatividades?.map(sub => {
          if (sub.id === subId) {
            return { ...sub, concluida: checked };
          }
          return sub;
        }) || [];
        
        return {
          ...servico,
          subatividades: subatividadesAtualizadas
        };
      }
      return servico;
    });
    
    // Atualiza a ordem localmente
    const ordemAtualizada = {
      ...ordem,
      servicos: servicosAtualizados
    };
    
    // Chama o método para atualizar o estado da ordem
    handleOrdemUpdate(ordemAtualizada);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="mb-4">
        <OrdemHeaderCustom 
          id={ordem.id}
          nome={ordem.nome}
          canEdit={!isEditando && canEditThisOrder}
          onEditClick={() => setIsEditando(true)}
          onDeleteClick={() => setDeleteDialogOpen(true)}
          ordem={ordem}
        />
      </div>

      {isEditando ? (
        <OrdemForm 
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          defaultValues={{
            id: ordem.id,
            nome: ordem.nome,
            clienteId: ordem.cliente?.id || "",
            motorId: ordem.motorId || "",
            dataAbertura: ordem.dataAbertura ? new Date(ordem.dataAbertura) : new Date(),
            dataPrevistaEntrega: ordem.dataPrevistaEntrega ? new Date(ordem.dataPrevistaEntrega) : new Date(),
            prioridade: ordem.prioridade || "media",
            servicosTipos: ordem.servicos?.map(s => s.tipo) || [],
            servicosDescricoes: ordem.servicos?.reduce((acc, s) => {
              acc[s.tipo] = s.descricao;
              return acc;
            }, {} as Record<string, string>) || {},
            servicosSubatividades: ordem.servicos?.reduce((acc, s) => {
              if (s.subatividades) {
                acc[s.tipo] = s.subatividades;
              }
              return acc;
            }, {} as Record<string, SubAtividade[]>) || {}
          }}
          defaultFotosEntrada={ordem?.fotosEntrada || []}
          defaultFotosSaida={ordem?.fotosSaida || []}
          onCancel={() => setIsEditando(false)}
          onSubatividadeToggle={handleSubatividadeToggleInEditMode}
          isSubatividadeEditingEnabled={true}
          clientes={clientes}
          isLoadingClientes={isLoadingClientes}
        />
      ) : (
        <OrdemTabs
          ordem={ordem}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onStatusChange={handleStatusChange}
          onOrdemUpdate={handleOrdemUpdate}
        />
      )}
      
      <DeleteOrdemDialog
        isOpen={deleteDialogOpen}
        isDeleting={isSubmitting}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </Layout>
  );
}

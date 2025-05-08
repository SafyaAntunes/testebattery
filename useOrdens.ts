
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { OrdemServico } from '@/types/ordens';

export const useOrdens = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrdens = async () => {
    setLoading(true);
    try {
      const ordensRef = collection(db, 'ordens_servico');
      const q = query(ordensRef, orderBy("dataAbertura", "desc"));
      const snapshot = await getDocs(q);
      
      // Processar as ordens e carregar informações do cliente com seus motores
      const ordensData = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Verificar se há cliente com ID
        if (data.cliente && data.cliente.id) {
          try {
            // Buscar motores do cliente
            const motoresRef = collection(db, `clientes/${data.cliente.id}/motores`);
            const motoresSnapshot = await getDocs(motoresRef);
            const motores = motoresSnapshot.docs.map(motorDoc => ({
              id: motorDoc.id,
              ...motorDoc.data()
            }));
            
            // Adicionar motores ao cliente na ordem
            data.cliente.motores = motores;
          } catch (error) {
            console.error("Erro ao carregar motores do cliente:", error);
          }
        }
        
        // Converter Timestamp para Date
        const dataAbertura = data.dataAbertura instanceof Timestamp 
          ? data.dataAbertura.toDate() 
          : new Date();
        
        const dataPrevistaEntrega = data.dataPrevistaEntrega instanceof Timestamp 
          ? data.dataPrevistaEntrega.toDate() 
          : new Date();
        
        return {
          id: doc.id,
          ...data,
          dataAbertura,
          dataPrevistaEntrega
        } as OrdemServico;
      }));
      
      setOrdens(ordensData);
    } catch (error) {
      console.error("Erro ao carregar ordens:", error);
      toast.error('Erro ao carregar ordens de serviço.');
    } finally {
      setLoading(false);
    }
  };

  const getOrdem = async (id: string) => {
    try {
      const ordemRef = doc(db, 'ordens_servico', id);
      const ordemDoc = await getDoc(ordemRef);
      
      if (!ordemDoc.exists()) {
        return null;
      }
      
      const data = ordemDoc.data();
      
      // Carregar motores do cliente se houver um cliente vinculado
      if (data.cliente && data.cliente.id) {
        try {
          const motoresRef = collection(db, `clientes/${data.cliente.id}/motores`);
          const motoresSnapshot = await getDocs(motoresRef);
          const motores = motoresSnapshot.docs.map(motorDoc => ({
            id: motorDoc.id,
            ...motorDoc.data()
          }));
          
          data.cliente.motores = motores;
        } catch (error) {
          console.error("Erro ao carregar motores do cliente:", error);
        }
      }
      
      // Converter Timestamp para Date
      const dataAbertura = data.dataAbertura instanceof Timestamp 
        ? data.dataAbertura.toDate() 
        : new Date();
      
      const dataPrevistaEntrega = data.dataPrevistaEntrega instanceof Timestamp 
        ? data.dataPrevistaEntrega.toDate() 
        : new Date();
      
      return {
        id: ordemDoc.id,
        ...data,
        dataAbertura,
        dataPrevistaEntrega
      } as OrdemServico;
    } catch (error) {
      console.error("Erro ao carregar ordem:", error);
      toast.error('Erro ao carregar ordem de serviço.');
      return null;
    }
  };

  const saveOrdem = async (ordem: OrdemServico) => {
    try {
      const { id, ...ordemData } = ordem;
      
      // Clone the object to avoid modifying the original
      const ordemToSave = { ...ordemData };
      
      // Converter Date para Timestamp
      if (ordemToSave.dataAbertura instanceof Date) {
        ordemToSave.dataAbertura = Timestamp.fromDate(ordemToSave.dataAbertura);
      }
      
      if (ordemToSave.dataPrevistaEntrega instanceof Date) {
        ordemToSave.dataPrevistaEntrega = Timestamp.fromDate(ordemToSave.dataPrevistaEntrega);
      }
      
      const ordemRef = id ? doc(db, 'ordens_servico', id) : doc(collection(db, 'ordens_servico'));
      await setDoc(ordemRef, ordemToSave, { merge: true });
      toast.success('Ordem salva com sucesso!');
      return true;
    } catch (error) {
      console.error("Erro ao salvar ordem:", error);
      toast.error('Erro ao salvar ordem de serviço.');
      return false;
    }
  };

  const updateOrdem = async (ordem: OrdemServico) => {
    try {
      // Clone do objeto para não modificar o original
      const ordemUpdate = { ...ordem };
      
      // Create a new object for Firestore update
      const updateData: Record<string, any> = {};
      
      // Convert Date fields to Timestamp for Firestore
      if (ordemUpdate.dataAbertura instanceof Date) {
        updateData.dataAbertura = Timestamp.fromDate(ordemUpdate.dataAbertura);
      }
      
      if (ordemUpdate.dataPrevistaEntrega instanceof Date) {
        updateData.dataPrevistaEntrega = Timestamp.fromDate(ordemUpdate.dataPrevistaEntrega);
      }
      
      // Copy all other fields
      Object.keys(ordemUpdate).forEach(key => {
        if (key !== 'id' && key !== 'dataAbertura' && key !== 'dataPrevistaEntrega') {
          updateData[key] = ordemUpdate[key as keyof typeof ordemUpdate];
        }
      });
      
      const ordemRef = doc(db, 'ordens_servico', ordem.id);
      await updateDoc(ordemRef, updateData);
      toast.success('Ordem atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
      toast.error('Erro ao atualizar ordem de serviço.');
      return false;
    }
  };

  const deleteOrdem = async (id: string) => {
    try {
      const ordemRef = doc(db, 'ordens_servico', id);
      await deleteDoc(ordemRef);
      toast.success('Ordem excluída com sucesso!');
      return true;
    } catch (error) {
      console.error("Erro ao excluir ordem:", error);
      toast.error('Erro ao excluir ordem de serviço.');
      return false;
    }
  };

  const deleteMultipleOrdens = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map(async (id) => {
          const ordemRef = doc(db, 'ordens_servico', id);
          await deleteDoc(ordemRef);
        })
      );
      toast.success(`${ids.length} ${ids.length === 1 ? 'ordem excluída' : 'ordens excluídas'} com sucesso`);
      return true;
    } catch (error) {
      console.error("Erro ao excluir ordens:", error);
      toast.error('Erro ao excluir ordens de serviço.');
      return false;
    }
  };

  return {
    ordens,
    loading,
    fetchOrdens,
    getOrdem,
    saveOrdem,
    updateOrdem,
    deleteOrdem,
    deleteMultipleOrdens
  };
};

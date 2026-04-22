import Button from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Stack } from "@/styled/jsx";
import type { AnonymizerLabels } from "@/types/aymurai";

interface ReplaceDialogProps {
  isOpen: boolean;
  label: AnonymizerLabels;
  onClose: (open: boolean) => void;
  onConfirm: () => void;
}
export default function ReplaceDialog({
  isOpen,
  onClose,
  onConfirm,
  label,
}: ReplaceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger>hola</DialogTrigger>
      <DialogContent>
        <DialogTitle>Reemplazar</DialogTitle>
        <Stack>
          ¿Deseas eliminar todas las etiquetas <b>{label}</b>?
        </Stack>
        <DialogFooter>
          <Button onClick={onConfirm}>Aplicar</Button>
          <Button onClick={() => onClose(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

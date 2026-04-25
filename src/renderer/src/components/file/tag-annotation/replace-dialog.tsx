import Button from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stack } from "@/styled/jsx";

interface ReplaceDialogProps {
  isOpen: boolean;
  label: string;
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
      <DialogContent>
        <DialogTitle>Reemplazar todas las ocurrencias</DialogTitle>
        <Stack>
          ¿Deseas reemplazar todas las ocurrencias con la etiqueta{" "}
          <b>{label}</b>?
        </Stack>
        <DialogFooter>
          <Button onClick={onConfirm}>Aplicar</Button>
          <Button onClick={() => onClose(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

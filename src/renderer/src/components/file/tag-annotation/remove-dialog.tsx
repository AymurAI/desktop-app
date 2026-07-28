import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@aymurai/ui";

interface RemoveDialogProps {
  isOpen: boolean;
  text: string;
  onClose: (open: boolean) => void;
  onConfirm: () => void;
}
export default function RemoveDialog({
  isOpen,
  onClose,
  onConfirm,
  text,
}: RemoveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="sm">
        <DialogTitle>Eliminar ocurrencias con este texto</DialogTitle>
        <p id="remove-dialog-description">
          Se eliminarán todas las ocurrencias que coincidan exactamente con el
          texto <b>{text}</b>. ¿Deseas continuar?
        </p>
        <DialogFooter>
          <Button onClick={onConfirm}>Eliminar</Button>
          <Button onClick={() => onClose(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

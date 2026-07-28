import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@aymurai/ui";

interface RemoveDialogProps {
  isOpen: boolean;
  label: string;
  onClose: (open: boolean) => void;
  onConfirm: () => void;
}
export default function RemoveDialog({
  isOpen,
  onClose,
  onConfirm,
  label,
}: RemoveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="sm">
        <DialogTitle>Eliminar todas las ocurrencias</DialogTitle>
        <p>
          ¿Deseas eliminar todas las ocurrencias del grupo con la etiqueta{" "}
          <b>{label}</b>?
        </p>
        <DialogFooter>
          <Button onClick={onConfirm}>Eliminar</Button>
          <Button onClick={() => onClose(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

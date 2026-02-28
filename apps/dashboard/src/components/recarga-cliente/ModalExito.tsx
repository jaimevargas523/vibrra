import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { RecargaResultado } from "@/hooks/useRecargaCliente";

interface Props {
  open: boolean;
  resultado: RecargaResultado | null;
  onRecargarOtro: () => void;
  onCerrar: () => void;
  fmt: (n: number) => string;
}

export function ModalExito({ open, resultado, onRecargarOtro, onCerrar, fmt }: Props) {
  if (!open || !resultado) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal */}
      <div className="relative bg-surface rounded-2xl border border-border w-full max-w-sm mx-4 overflow-hidden">
        <div className="p-6 space-y-5">
          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-text-primary">Recarga exitosa</h3>
            <p className="text-sm text-text-muted mt-1">{resultado.clienteNombre}</p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm bg-surface-elevated rounded-lg px-3 py-2.5">
              <span className="text-text-secondary">{"\uD83D\uDCB0"} Saldo acreditado</span>
              <span className="font-mono font-bold text-text-primary">
                {fmt(resultado.montoAcreditado)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm bg-surface-elevated rounded-lg px-3 py-2.5">
              <span className="text-text-secondary">{"\uD83C\uDFB5"} Canciones gratis</span>
              <span className="font-mono font-bold text-blue-400">
                x{resultado.bonos.canciones}
              </span>
            </div>

            {resultado.bonos.conexiones > 0 && (
              <div className="flex items-center justify-between text-sm bg-surface-elevated rounded-lg px-3 py-2.5">
                <span className="text-text-secondary">{"\uD83D\uDD0C"} Conexiones gratis</span>
                <span className="font-mono font-bold text-success">
                  x{resultado.bonos.conexiones}
                </span>
              </div>
            )}

            <div className="border-t border-border pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Tu nuevo saldo</span>
                <span className="font-mono font-bold text-gold">
                  {fmt(resultado.nuevoSaldoAnfitrion)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" onClick={onRecargarOtro}>
              Recargar otro cliente
            </Button>
            <Button variant="ghost" className="w-full" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

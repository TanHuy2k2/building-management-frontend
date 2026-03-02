import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Wallet, Banknote } from 'lucide-react';
import { PaymentForm, PaymentMethod, PaymentReferenceType, PaymentServiceProvider, ResponseInterface } from '../types';
import { Card } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import {
  createMomoPaymentApi,
  createPaymentApi,
  createVnpayPaymentApi,
} from '../services/paymentService';
import toast from 'react-hot-toast';

interface Props {
  amount: number;
  reference_id: string;
  reference_type: PaymentReferenceType;
  returnUrl: string;
}

export default function PaymentMethodSelector({
  amount,
  reference_id,
  reference_type,
  returnUrl,
}: Props) {
  const [provider, setProvider] = useState<PaymentServiceProvider | null>(null);
  const [form, setForm] = useState<PaymentForm>({
    reference_id,
    reference_type,
    method: PaymentMethod.CASH,
  });
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);

      if (form.method === PaymentMethod.WALLET && !provider) {
        toast.error('Please select MoMo or VNPay');

        return;
      }

      const res = await createPaymentApi(form);
      if (!res.success) {
        toast.error(res.message);

        return;
      }

      if (form.method === PaymentMethod.WALLET) {
        let payRes: ResponseInterface;
        switch (provider) {
          case PaymentServiceProvider.MOMO:
            payRes = await createMomoPaymentApi({
              payment_id: res.data.id,
              amount,
              return_url: returnUrl,
            });

            break;

          case PaymentServiceProvider.VNPAY:
            payRes = await createVnpayPaymentApi({
              payment_id: res.data.id,
              amount,
              return_url: returnUrl,
            });

            break;

          default:
            toast.error('Please select payment provider');

            return;
        }

        if (!payRes.success) {
          toast.error(payRes.message);

          return;
        }

        if (payRes.data?.payUrl) {
          window.location.href = String(payRes.data.payUrl);
        }
      }
    } catch (err) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Payment</h3>
        <p className="text-sm text-muted-foreground">
          Amount: <b>{amount.toLocaleString()} VND</b>
        </p>
      </div>

      {/* Method */}
      <RadioGroup
        value={form.method}
        onValueChange={(v: any) =>
          setForm((prev) => ({
            ...prev,
            method: v as PaymentMethod,
          }))
        }
        className="space-y-2"
      >
        {/* Wallet */}
        <Label
          className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition
    ${form.method === PaymentMethod.WALLET ? 'border-blue-500 bg-blue-100' : ''}
  `}
        >
          <RadioGroupItem value={PaymentMethod.WALLET} />
          <Wallet className="size-5" />
          Wallet
        </Label>

        {/* Providers */}
        {form.method === PaymentMethod.WALLET && (
          <div className="ml-6 space-y-2">
            <Label
              className={`flex items-center gap-3 border rounded-lg p-2 cursor-pointer ${
                provider === PaymentServiceProvider.MOMO ? 'border-blue-500 bg-blue-100' : ''
              }`}
              onClick={() => setProvider(PaymentServiceProvider.MOMO)}
            >
              <img src="/images/momo.png" alt="momo" className="w-8 h-8" />
              MoMo
            </Label>

            <Label
              className={`flex items-center gap-3 border rounded-lg p-2 cursor-pointer ${
                provider === PaymentServiceProvider.VNPAY ? 'border-blue-500 bg-blue-100' : ''
              }`}
              onClick={() => setProvider(PaymentServiceProvider.VNPAY)}
            >
              <img src="/images/vnpay.png" alt="vnpay" className="w-8 h-8" />
              VNPay
            </Label>
          </div>
        )}

        {/* Cash */}
        <Label
          className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition
    ${form.method === PaymentMethod.CASH ? 'border-blue-500 bg-blue-100' : ''}
  `}
        >
          <RadioGroupItem value={PaymentMethod.CASH} />
          <Banknote className="size-5" />
          Cash
        </Label>
      </RadioGroup>

      <Button className="w-full" onClick={handleConfirmPayment} disabled={loading}>
        {loading ? 'Processing...' : 'Confirm Payment'}
      </Button>
    </Card>
  );
}

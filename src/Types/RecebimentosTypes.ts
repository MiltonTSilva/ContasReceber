export type Recebimento = {
  id: string;
  received_date: string;
  payment_received_at: string;
  amount_to_receive: number;
  custumer_id: string;
  active: boolean;
  custumer: {
    id: string;
    name: string;
  } | null;
};

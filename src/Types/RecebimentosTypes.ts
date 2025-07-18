export type Recebimento = {
  id: string;
  received_date: string;
  payment_received_at: string;
  amount_to_receive: number;
  costumer_id: string;
  active: boolean;
  user_id: string;
  custumer: {
    id: string;
    name: string;
  } | null;
};

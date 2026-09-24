import { Link } from 'react-router';

export function RouteStatus({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <section className="status-page">
      <p className="eyebrow">Despertar para a Ciência</p>
      <h1>{title}</h1>
      <p>{message}</p>
      {action ?? <Link className="button button--primary" to="/">Voltar ao início</Link>}
    </section>
  );
}

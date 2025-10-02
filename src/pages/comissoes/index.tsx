import { Navigate } from 'react-router-dom';

/**
 * Redirect para a tela de comissões de escritório
 * Mantém compatibilidade com links antigos para /comissoes
 */
export default function Comissoes() {
  return <Navigate to="/comissoes/escritorio" replace />;
}

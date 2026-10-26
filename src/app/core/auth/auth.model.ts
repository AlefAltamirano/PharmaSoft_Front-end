export interface UsuarioPerfil {
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: string[];
}

export interface Sesion {
  token: string;
  expiraEn: number;
  username: string;
  nombreCompleto: string;
  roles: string[];
  permisos: string[];
}


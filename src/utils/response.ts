import { Response } from 'express';

export const ok = (res: Response, data: unknown, message = 'Sucesso') => {
  res.status(200).json({ success: true, message, data });
};

export const created = (res: Response, data: unknown, message = 'Criado com sucesso') => {
  res.status(201).json({ success: true, message, data });
};

export const noContent = (res: Response) => {
  res.status(204).send();
};

export const badRequest = (res: Response, message = 'Dados inválidos', errors?: unknown) => {
  res.status(400).json({ success: false, message, errors });
};

export const unauthorized = (res: Response, message = 'Não autorizado') => {
  res.status(401).json({ success: false, message });
};

export const forbidden = (res: Response, message = 'Acesso negado') => {
  res.status(403).json({ success: false, message });
};

export const notFoundResp = (res: Response, message = 'Recurso não encontrado') => {
  res.status(404).json({ success: false, message });
};

export const conflict = (res: Response, message = 'Conflito de dados') => {
  res.status(409).json({ success: false, message });
};

export const serverError = (res: Response, message = 'Erro interno do servidor') => {
  res.status(500).json({ success: false, message });
};

export const paginated = (
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  extra?: Record<string, unknown>
) => {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    ...extra,
  });
};

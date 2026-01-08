export const ok = (res, data, message = 'OK') => res.status(200).json({ success: true, message, data });
export const created = (res, data, message = 'Created') => res.status(201).json({ success: true, message, data });
export const noContent = (res) => res.status(204).send();
export const badRequest = (res, message = 'Bad Request') => res.status(400).json({ success: false, message });
export const unauthorized = (res, message = 'Unauthorized') => res.status(401).json({ success: false, message });
export const forbidden = (res, message = 'Forbidden') => res.status(403).json({ success: false, message });
export const notFound = (res, message = 'Not Found') => res.status(404).json({ success: false, message });
export const internal = (res, message = 'Internal Server Error') => res.status(500).json({ success: false, message });

export const success = (res, message, data, status = 200) => res.status(status).json({ success: true, message, data });
export const error = (res, message, status = 500) => res.status(status).json({ success: false, message });

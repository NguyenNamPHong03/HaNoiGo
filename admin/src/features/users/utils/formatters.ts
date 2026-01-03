// User utilities - Format functions

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN");
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

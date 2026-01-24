// Review types
export interface Review {
  _id: string;
  user: {
    _id: string;
    displayName?: string;
    email?: string;
    avatarUrl?: string;
  };
  place: {
    _id: string;
    name: string;
  };
  rating: number;
  comment: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  status?: 'published' | 'pending' | 'hidden';
  helpfulCount?: number;
}

export interface ReviewsListParams {
  page?: number;
  limit?: number;
  search?: string;
  placeId?: string;
  userId?: string;
  rating?: number;
  status?: string;
}

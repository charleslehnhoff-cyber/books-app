export type BookType = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  cover?: string;
  collections?: string[];
  progress?: number;
  currentPage?: number;
  progressPercent?: number;
  uploadDate?: string;
  totalPages?: number;
};

export type ShelfType = {
  id: string;
  name: string;
  order: number;
  icon?: string;
  color?: string;
};

export type UploadTask = {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
};

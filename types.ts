export type uuid = string;

export type TodoItem = { 
    id: uuid,
    text: string,
    done: boolean, 
    createdAt: Date 
};

export enum FilterType {
  ALL = "Todos",
  PENDING = "Pendentes",
  COMPLETED = "Concluídos"
}
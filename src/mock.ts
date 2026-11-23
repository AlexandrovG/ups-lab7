import {publicAsset} from './config/runtime';
export interface UpsAttribute {
  id: number;
  name: string;
  value: string; 
}

export interface UpsMedia {id:number;ups_id?:number;url:string;kind:"image"|"video";created_at?:string}

export interface UpsItem {
  id: number;
  ups_name: string;
  description: string;
  capacity: number;
  max_current: number;
  image_url: string;
  video_url: string;
  likes_count: number;
  media?:UpsMedia[];
  status?:string;
  attributes: UpsAttribute[];
  is_creator?: boolean;
  is_liked?: boolean;
}

export const MOCK_DATA: UpsItem[] = [
  {
    id: 1,
    ups_name: "ИБП APC Smart-UPS 1500",
    description: "Линейно-интерактивный ИБП для офиса",
    capacity: 1500,
    max_current: 10,
    image_url: publicAsset("1.jpg"), 
    video_url: "",
    likes_count: 3,
    attributes: [
      { id: 1, name: "Производитель", value: "APC" },
      { id: 2, name: "Тип", value: "Линейно-интерактивный" },
      { id: 3, name: "Гарантия", value: "24 месяца" }
    ]
  },
  {
    id: 2,
    ups_name: "ИБП CyberPower OLS2000",
    description: "Онлайн-ИБП с двойным преобразованием",
    capacity: 2000,
    max_current: 8,
    image_url: publicAsset("default.png"), 
    video_url: "",
    likes_count: 1,
    attributes: [
      { id: 1, name: "Производитель", value: "CyberPower" },
      { id: 2, name: "Тип", value: "" }, // Пустое
    ]
  },
  {
    id: 3, ups_name: "Office UPS 650 — рабочее место",
    description: "Компактный учебный ИБП для одного рабочего места.", capacity: 650, max_current: 3,
    image_url: publicAsset("1.jpg"), video_url: "", likes_count: 2,
    attributes: [{id:1,name:"Применение",value:"Рабочее место"}]
  },
  {
    id: 4, ups_name: "Office UPS 2000 — отдел IT",
    description: "Демонстрационная модель резервного питания офисного оборудования.", capacity: 2000, max_current: 10,
    image_url: publicAsset("default.png"), video_url: "", likes_count: 6,
    attributes: [{id:1,name:"Применение",value:"IT-отдел"}]
  },
  {
    id: 5, ups_name: "Office UPS 3000 — резервное питание",
    description: "Демонстрационный источник бесперебойного питания для офиса.", capacity: 3000, max_current: 16,
    image_url: publicAsset("1.jpg"), video_url: "", likes_count: 4,
    attributes: [{id:1,name:"Применение",value:"Резервное питание"}]
  }
];
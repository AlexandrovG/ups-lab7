import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { api, bearerHeaders } from '../api';
import { mediaUrl } from '../api/media';
import { MOCK_DATA, type UpsItem } from '../mock';
import {pagesDemo} from '../config/runtime';
import type { RootState } from '../store';

interface UninterruptiblePowerSuppliesState {
  items: UpsItem[];
  loading: boolean;
  pendingRequests: number;
  filterMinCapacity: number;
  filterMaxCapacity: number;
  source: 'api'|'mock'|null;
  error: string|null;
  draft: {id: number; ups_name:string}|null;
}
const initialState: UninterruptiblePowerSuppliesState = {
  items: [], loading: false, pendingRequests: 0, filterMinCapacity: 0,
  filterMaxCapacity: 0, source: null, error: null, draft: null,
};
const serverError = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && error.response
    ? `${fallback} (HTTP ${error.response.status})`
    : fallback;
const auth = (state: RootState) => {
  if (!state.auth.isAuthenticated || !state.auth.token) throw new Error('Сначала войдите в систему');
  return bearerHeaders(state.auth.token);
};
const mapItem = (i: import('../api/Api').DsUninterruptiblePowerSupplySerializer): UpsItem => ({
  id: i.id ?? 0, ups_name: i.ups_name ?? '', description: i.description ?? '',
  capacity: i.capacity ?? 0, max_current: i.max_current ?? 0,
  image_url: mediaUrl(i.image_url), video_url: i.video_url ? mediaUrl(i.video_url) : '',
  likes_count: i.likes_count ?? 0, is_creator: i.is_creator ?? false, is_liked: i.is_liked ?? false,
  media: (i.media ?? []).map(m => ({id:m.id??0,ups_id:m.ups_id??0,url:mediaUrl(m.url),kind:(m.kind==='video'?'video':'image') as "image"|"video"})),
  status: i.status ?? "",
  attributes: (i.attributes ?? []).map(a => ({id: a.attribute_id ?? a.id ?? 0, name: a.attribute?.name ?? '', value: a.value ?? ''})),
});

export const fetchUpsList = createAsyncThunk('uninterruptible_power_supplies/fetchList',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    if (pagesDemo) {
      // GitHub Pages is static hosting: never try /api or MinIO from the user's phone.
      const min = state.uninterruptible_power_supplies.filterMinCapacity;
      const max = state.uninterruptible_power_supplies.filterMaxCapacity;
      return {source: 'mock' as const,
        items: MOCK_DATA.filter(i => (!min || i.capacity >= min) && (!max || i.capacity <= max))};
    }
    try {
      const response = await api.uninterruptiblePowerSupplies.uninterruptiblePowerSuppliesList({
        min_capacity: state.uninterruptible_power_supplies.filterMinCapacity || undefined,
        max_capacity: state.uninterruptible_power_supplies.filterMaxCapacity || undefined,
      }, bearerHeaders(state.auth.isAuthenticated ? state.auth.token : null));
      return {source: 'api' as const, items: response.data.map(mapItem)};
    } catch (error) {
      // Mock допустим только гостю и только при сетевой недоступности бэкенда.
      const unavailable = axios.isAxiosError(error) && !error.response;
      if (state.auth.isAuthenticated || !unavailable)
        return rejectWithValue(serverError(error, 'Ошибка получения ИБП от сервера'));
      const min = state.uninterruptible_power_supplies.filterMinCapacity;
      const max = state.uninterruptible_power_supplies.filterMaxCapacity;
      return {source: 'mock' as const,
        items: MOCK_DATA.filter(i => (!min || i.capacity >= min) && (!max || i.capacity <= max))};
    }
  });

export const fetchUpsDraft = createAsyncThunk('uninterruptible_power_supplies/fetchDraft',
  async (_, {getState, rejectWithValue}) => {
    try {
      const response = await api.uninterruptiblePowerSupplies.draftList(auth(getState() as RootState));
      return {id: response.data.id ?? 0, ups_name: response.data.ups_name ?? ''};
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      return rejectWithValue(serverError(error, 'Не удалось проверить черновик'));
    }
  });

export const createUpsDraft = createAsyncThunk('uninterruptible_power_supplies/createDraft',
  async (ups_name:string, {getState, rejectWithValue}) => {
    try {
      const response = await api.uninterruptiblePowerSupplies.uninterruptiblePowerSuppliesCreate(
        {ups_name}, auth(getState() as RootState));
      return {id: response.data.id ?? 0, ups_name: response.data.ups_name ?? ups_name};
    } catch (error) {
      return rejectWithValue(serverError(error, 'Не удалось создать черновик'));
    }
  });

export const publishUps = createAsyncThunk('uninterruptible_power_supplies/publish',
  async (data: {description:string; capacity:number; max_current:number;image?:File;video?:File},
         {getState, rejectWithValue}) => {
    try {
      const response = await api.uninterruptiblePowerSupplies.publishUpdate(data, auth(getState() as RootState));
      return mapItem(response.data);
    } catch (error) {
      return rejectWithValue(serverError(error, 'Не удалось опубликовать услугу; черновик можно повторно отправить'));
    }
  });

export const deleteUps = createAsyncThunk('uninterruptible_power_supplies/delete',
  async (id:number, {getState, rejectWithValue}) => {
    try {
      await api.uninterruptiblePowerSupplies.uninterruptiblePowerSuppliesDelete(id, auth(getState() as RootState));
      return id;
    } catch (error) {return rejectWithValue(serverError(error, 'Ошибка удаления услуги'));}
  });

export const likeUps = createAsyncThunk('uninterruptible_power_supplies/like',
  async (data: {id:number;value:0|1}, {getState, rejectWithValue}) => {
    try {
      await api.uninterruptiblePowerSupplies.likeCreate(data.id, {value:data.value}, auth(getState() as RootState));
      return data;
    } catch (error) {return rejectWithValue(serverError(error, 'Ошибка сохранения лайка'));}
  });

const uninterruptiblePowerSuppliesSlice = createSlice({
  name: 'uninterruptible_power_supplies', initialState,
  reducers: {
    setFilterMin(state, a: PayloadAction<number>) {state.filterMinCapacity = a.payload;},
    setFilterMax(state, a: PayloadAction<number>) {state.filterMaxCapacity = a.payload;},
    resetFilters(state) {state.filterMinCapacity = 0; state.filterMaxCapacity = 0;},
    clearDraft(state) {state.draft = null;},
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUpsList.fulfilled, (s,a) => {s.items=a.payload.items;s.source=a.payload.source;s.error=null;})
      .addCase(fetchUpsList.rejected, (s,a) => {s.items=[];s.source=null;s.error=String(a.payload ?? a.error.message);})
      .addCase(fetchUpsDraft.fulfilled, (s,a)=> {s.draft=a.payload;})
      .addCase(fetchUpsDraft.rejected, (s,a)=> {s.error=String(a.payload ?? a.error.message);})
      .addCase(createUpsDraft.fulfilled, (s,a)=> {s.draft=a.payload;})
      .addCase(publishUps.fulfilled, (s,a)=> {s.draft=null;s.items.unshift(a.payload);})
      .addCase(deleteUps.fulfilled, (s,a)=> {s.items=s.items.filter(i=>i.id!==a.payload);})
      .addCase(likeUps.fulfilled, (s,a)=> {
        const item=s.items.find(i=>i.id===a.payload.id);
        if(item && item.is_liked !== (a.payload.value===1)) {
          item.likes_count = Math.max(0, item.likes_count + (a.payload.value===1 ? 1 : -1));
          item.is_liked = a.payload.value===1;
        }
      })
      .addMatcher(a=>a.type.startsWith('uninterruptible_power_supplies/') && a.type.endsWith('/pending'),s=>{
        s.pendingRequests++;s.loading=true;
      })
      .addMatcher(a=>a.type.startsWith('uninterruptible_power_supplies/') &&
        (a.type.endsWith('/fulfilled')||a.type.endsWith('/rejected')),s=>{
        s.pendingRequests=Math.max(0,s.pendingRequests-1);s.loading=s.pendingRequests>0;
      });
  },
});
export const {setFilterMin,setFilterMax,resetFilters,clearDraft} = uninterruptiblePowerSuppliesSlice.actions;
export default uninterruptiblePowerSuppliesSlice.reducer;

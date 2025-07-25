import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface OtherState {
  selectedChain: 'eth' | 'sol'
  referralCode: string | null
}

const initialState: OtherState = {
  selectedChain: 'eth',
  referralCode: null,
}

const otherSlice = createSlice({
  name: 'other',
  initialState,
  reducers: {
    setSelectedChain: (state, action: PayloadAction<'eth' | 'sol'>) => {
      state.selectedChain = action.payload
    },
    setReferralCode: (state, action: PayloadAction<string | null>) => {
      state.referralCode = action.payload
    },
  },
})

export const { 
  setSelectedChain, 
  setReferralCode, 
} = otherSlice.actions
export default otherSlice.reducer
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  results: [],
  loading: false,
  error: null,
  criteria: null,
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    searchStart(state) {
      state.loading = true
      state.error = null
    },
    searchSuccess(state, action) {
      state.results = action.payload
      state.loading = false
    },
    searchFailure(state, action) {
      state.error = action.payload
      state.loading = false
    },
    setCriteria(state, action) {
      state.criteria = action.payload
    },
    clearResults(state) {
      state.results = []
      state.criteria = null
    },
  },
})

export const { searchStart, searchSuccess, searchFailure, setCriteria, clearResults } = searchSlice.actions
export default searchSlice.reducer

import { configureStore } from '@reduxjs/toolkit'
import searchReducer from './reducers/searchReducer'
import authReducer from './reducers/authReducer'

export const store = configureStore({
  reducer: {
    search: searchReducer,
    auth: authReducer,
  },
})


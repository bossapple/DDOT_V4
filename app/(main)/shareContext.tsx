'use client'

import { useState, createContext, ChangeEvent, ReactNode, MouseEventHandler } from 'react'
import { client } from '../lib/API'
import { ApolloProvider, gql } from '@apollo/client';

interface ThemeContextType {
  searchData: string
  setSearchData: React.Dispatch<React.SetStateAction<string>>
  applyFilter: boolean
  setApplyFilter: React.Dispatch<React.SetStateAction<boolean>>
  userRole: string
  setUserRole: React.Dispatch<React.SetStateAction<string>>
  handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleSearchClick: (React.MouseEventHandler<HTMLButtonElement>)
}

export interface IThemeProviderProps {
  children: ReactNode
}

export const ThemeContext = createContext<ThemeContextType>({
  searchData: '',
  setSearchData: () => {},
  applyFilter: false,
  userRole: '',
  setUserRole: () => {},
  setApplyFilter: () => {},
  handleSearchChange: () => {},
  handleSearchClick: () => {},
})

export const ThemeProvider: React.FC<IThemeProviderProps> = ({ children }) => {
  const [searchData, setSearchData] = useState('')
  const [applyFilter, setApplyFilter] = useState(false)
  const [userRole, setUserRole] = useState('')

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchData(event.target.value)
    setApplyFilter(false)
  }

  const handleSearchClick: MouseEventHandler<HTMLButtonElement> = () => {
    setApplyFilter(searchData.trim() !== '')
  }

  return (
    <ApolloProvider client={client}>
      <ThemeContext.Provider
        value={{
          searchData,
          setSearchData,
          applyFilter,
          setApplyFilter,
          userRole,
          setUserRole,
          handleSearchChange,
          handleSearchClick
        }}
      >
        { children }
      </ThemeContext.Provider>
    </ApolloProvider>
  )
}

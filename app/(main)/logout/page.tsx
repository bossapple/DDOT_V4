"use client"

import Cookies from 'js-cookie'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';

function LogOutPage() {
  Cookies.remove("user");

  const { push } = useRouter();

  useEffect(() => {
     push('/login');
  }, []);
  return (
    <></>
  )
}

export default LogOutPage
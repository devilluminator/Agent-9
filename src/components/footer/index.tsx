import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';

function Footer() {
  // States
  const [version, setVersion] = useState("")
  // Effect
  useEffect(() => {
    getVersion().then((version) => {
      setVersion(version)
    });
  })
  return (
    <footer className='opacity-75 p-1.5 w-full text-muted text-sm text-right'>{version}</footer>
  )
}

export default Footer
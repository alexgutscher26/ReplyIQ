import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Test() {
  const [count, setCount] = useState(1)
  const increment = () => setCount(count => count + 1)

  return (
    <div>
      <p>
        This is React.
        {count}
      </p>
      <Button onClick={increment}>Increment</Button>
    </div>
  )
}

interface FormErrorProps {
  message?: string
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null
  return <p className="text-red-500 text-sm mb-3">{message}</p>
}

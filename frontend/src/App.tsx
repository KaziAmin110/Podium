import { useState } from 'react'

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname
  );
  const [questions, setQuestions] = useState<Record<number, string>>({});

  useEffect(() => {
    const onLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener("navigate", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("navigate", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case "/interview":
        return <InterviewPage questions={questions} />;
      case "/":
      default:
        return <HomePage setQuestions={setQuestions} />;
    }
  };

  return (
    <>
      <p className='text-5xl text-blue-900'>Hai</p>
    </>
  )
}

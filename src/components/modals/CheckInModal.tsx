import { useState } from "react";

export function CheckInModal({ onSave, onSkip }: { onSave: (d: any) => void; onSkip: () => void }) {
  const [mood, setMood] = useState(5);
  const [prod, setProd] = useState(5);
  const [notes, setNotes] = useState("");

  const NumberRow = ({ val, setVal }: any) => (
    <div className="flex justify-between mt-2">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => setVal(n)} className={`w-8 h-8 rounded-full font-serif flex items-center justify-center transition-colors ${n === val ? 'bg-racing text-white dark:bg-racing-400' : 'hover:bg-stone-200 dark:hover:bg-stone-800'}`}>
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-sm p-4">
      <div className="bg-alabaster dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-xl animate-rise">
        <h2 className="font-serif text-2xl text-center mb-6">Session Complete</h2>
        <div className="space-y-6">
          <div><p className="text-sm font-medium mb-1">Mood</p><NumberRow val={mood} setVal={setMood} /></div>
          <div><p className="text-sm font-medium mb-1">Productivity</p><NumberRow val={prod} setVal={setProd} /></div>
          <div><p className="text-sm font-medium mb-1">Notes (optional)</p>
            <input value={notes} onChange={e => setNotes(e.target.value)} maxLength={280} className="w-full bg-transparent border-b border-stone-300 dark:border-stone-700 py-2 focus:outline-none focus:border-racing" placeholder="What did you conquer?" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onSkip} className="px-4 py-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">Skip</button>
            <button onClick={() => onSave({ moodScore: mood, productivityScore: prod, notes })} className="px-6 py-2 rounded-full bg-racing text-white dark:bg-stone-800 transition-colors">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

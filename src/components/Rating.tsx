import { useState } from "react";

function Rating() {
  const [rating, setRating] = useState(0);

  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-2xl font-bold text-slate-900 mb-4">Citizen Rating</h3>

      <div className="flex gap-3 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl ${
              rating >= star ? "text-yellow-400" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="text-slate-600">
        Selected rating: <span className="font-semibold">{rating}</span>
      </p>
    </section>
  );
}

export default Rating;
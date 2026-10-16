import type { Design } from "../sculptures";
export function FormThumbnail({ form }: { form: Design }) {
  return (
    <svg viewBox="0 0 100 70" aria-hidden="true" className="form-thumbnail">
      <path d="M22 54 51 45 82 55 53 65Z" fill="#d8d5c9" />
      <path d="M22 54 53 63 82 55 82 60 53 69 22 60Z" fill="#b9b5a7" />
      {form === "tree" || form === "bonsai" ? (
        <>
          <path
            d={
              form === "tree"
                ? "M51 55Q44 36 54 20M49 42 34 28M50 32 71 22"
                : "M51 55Q65 37 51 26M56 39 76 35M54 30 33 21"
            }
            fill="none"
            stroke="#76644c"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {[
            [33, 24, 16, 10],
            [61, 17, 17, 11],
            [71, 30, 16, 11],
            [44, 34, 17, 10],
          ].map(([x, y, rx, ry], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y + (form === "bonsai" ? i * 2 : 0)}
              rx={rx}
              ry={ry}
              fill={["#869578", "#586b51", "#a7b294", "#6d815e"][i]}
            />
          ))}
        </>
      ) : form === "flower" ? (
        <>
          <path
            d="M52 56Q41 39 51 25"
            fill="none"
            stroke="#6e8259"
            strokeWidth="3"
          />
          <path
            d="M49 47Q30 28 31 42Q32 51 49 47M49 40Q69 22 68 37Q65 44 49 40"
            fill="#8fa379"
          />
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse
              key={i}
              cx="51"
              cy="17"
              rx="6"
              ry="13"
              transform={`rotate(${i * 36} 51 24)`}
              fill={i % 2 ? "#c17e94" : "#e4b0bb"}
            />
          ))}
          <circle cx="51" cy="24" r="7" fill="#b29550" />
          <circle cx="49" cy="22" r="3" fill="#d9bc70" />
        </>
      ) : (
        <>
          {[
            [35, 32, 8, 25],
            [52, 13, 10, 44],
            [70, 30, 8, 28],
          ].map(([x, y, w, h], i) => (
            <g key={i}>
              <path
                d={`M${x - w} ${y + 8} ${x} ${y} ${x + w} ${y + 8}V${y + h}L${x} ${y + h + 4} ${x - w} ${y + h}Z`}
                fill={["#8ba5a0", "#718c91", "#a9bcaf"][i]}
              />
              <path
                d={`M${x} ${y}V${y + h + 4}L${x + w} ${y + h}V${y + 8}Z`}
                fill="#5b777d"
                opacity=".55"
              />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

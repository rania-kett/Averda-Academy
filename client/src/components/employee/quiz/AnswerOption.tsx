import { motion } from "framer-motion";

export function AnswerOption(props: {
  letter: string;
  text: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { letter, text, selected, disabled, onSelect } = props;
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onSelect}
      className={`min-h-[56px] w-full rounded-2xl border-2 px-4 py-3 text-start text-[16px] font-semibold leading-relaxed transition-transform active:scale-95 ${
        selected
          ? "border-[#1e3a5f] bg-[#1e3a5f]/10 text-[#1C1917] dark:border-[#1e3a5f] dark:bg-[#1e3a5f]/20 dark:text-white"
          : "border-[#D6D3D1] bg-white text-[#1C1917] hover:bg-[#1e3a5f]/5 dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#1e3a5f]/10"
      } disabled:opacity-50`}
    >
      <span className="me-2 font-extrabold">{letter}.</span>
      {text}
    </motion.button>
  );
}


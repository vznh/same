// components/Placeholder
// Is rendered if no available frames are present.

import Image from "next/image";

const Placeholder = () => {
  return <div className="flex flex-col gap-2 font-light tracking-tight">
    <div className="flex flex-row">
      <Image src={""} alt={""} />
      <h1 className="text-xl">
        <span className="text-[#1E1919]">Hold down anywhere</span>
        <span className="text-[#9D9D9D]">{" "}to create a new frame, or get started with</span>
      </h1>
    </div>
    <div className="flex flex-row">
      <button className="">Create a tool</button>
      <button>Build a website</button>
      <button>Start from a template</button>
      <button>View other&apos;s work</button>
    </div>
  </div>
};

export { Placeholder };

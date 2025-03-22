import Image from "next/image"

export const Loading = () => {
    return (
        <div className="flex w-full h-full items-center justify-center bg-grey">
            <Image
                src={"/Ripple-logo.svg"}
                alt="logo"
                width={100}
                height={100}
                className="animate-pulse duration-700 m-auto"
            />
        </div>
    )
}
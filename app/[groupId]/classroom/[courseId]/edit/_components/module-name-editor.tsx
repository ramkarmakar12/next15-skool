"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ElementRef, useRef, useState, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";

interface NameEditorProps {
    id: Id<"courseModules">;
    name: string;
}

export const ModuleNameEditor = ({
    id,
    name
}: NameEditorProps) => {
    const inputRef = useRef<ElementRef<"textarea">>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(name);
    
    // Update when name prop changes
    useEffect(() => {
        setValue(name);
    }, [name]);

    const update = useMutation(api.courseModules.updateTitle);

    const enableInput = () => {
        setIsEditing(true);
        setTimeout(() => {
            setValue(name);
            inputRef.current?.focus();
            const inputElement = inputRef.current;
            if (inputElement) {
                inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
            }
        }, 0);
    };

    const disableEditing = () => setIsEditing(false);

    const onInput = (value: string) => {
        setValue(value);
        update({
            moduleId: id,
            title: value || "Untitled"
        })
        .catch(error => {
            console.error("Failed to update module title:", error);
        });
    };

    const onKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            disableEditing();
        }
    };

    return (
        <div className="w-full">
            {isEditing ? (
                <TextareaAutosize
                    ref={inputRef}
                    onBlur={disableEditing}
                    onKeyDown={onKeyDown}
                    value={value}
                    onChange={(e) => onInput(e.target.value)}
                    className="w-full text-md bg-transparent font-bold break-words outline-none text-[#3F3F3F]"
                    maxLength={60}
                />
            ) : (
                <div
                    onClick={enableInput}
                    className="w-full pb-[11.5px] text-md font-bold break-words outline-none text-[#3F3F3F] cursor-pointer"
                >
                    {name}
                </div>
            )}
        </div>
    );
};
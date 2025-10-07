"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";
import { buttonVariants } from "./button";

export interface CalendarProps {
  className?: string;
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
  [key: string]: any;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-3", className)} {...props}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between">
              <button
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-medium">
                January 2024
              </div>
              <button
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <table className="w-full border-collapse space-y-1">
              <thead>
                <tr className="flex">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <th
                      key={day}
                      className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="flex flex-col space-y-1">
                {Array.from({ length: 6 }, (_, weekIndex) => (
                  <tr key={weekIndex} className="flex w-full mt-2">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const dayNumber = weekIndex * 7 + dayIndex - 6; // Simplified calculation
                      const isCurrentMonth = dayNumber > 0 && dayNumber <= 31;
                      const isToday = dayNumber === 15; // Mock today
                      
                      return (
                        <td key={dayIndex} className="h-9 w-9 text-center text-sm p-0 relative">
                          <button
                            className={cn(
                              buttonVariants({ variant: "ghost" }),
                              "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                              isToday && "bg-accent text-accent-foreground",
                              !isCurrentMonth && "text-muted-foreground opacity-50",
                              "hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            {isCurrentMonth ? dayNumber : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };

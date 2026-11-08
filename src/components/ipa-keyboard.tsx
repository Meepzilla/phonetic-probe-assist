
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_PHONEMES } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface IpaKeyboardProps {
    onButtonClick: (char: string) => void;
}

const VOWELS = ['i', 'ɪ', 'eɪ', 'ɛ', 'æ', 'ɑ', 'ɔ', 'oʊ', 'ʊ', 'u', 'ʌ', 'ə', 'ɚ', 'ɝ', 'aɪ', 'aʊ', 'ɔɪ'];
const CONSONANTS = ALL_PHONEMES.filter(p => !VOWELS.includes(p));

export function IpaKeyboard({ onButtonClick }: IpaKeyboardProps) {
    return (
        <Card className="mt-4">
            <CardHeader className="p-4">
                <CardTitle className="text-base">IPA Keyboard</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <Tabs defaultValue="consonants">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="consonants">Consonants</TabsTrigger>
                        <TabsTrigger value="vowels">Vowels</TabsTrigger>
                    </TabsList>
                    <TabsContent value="consonants">
                        <div className="grid grid-cols-8 gap-1 pt-2">
                            {CONSONANTS.map(char => (
                                <Button
                                    key={char}
                                    variant="outline"
                                    size="sm"
                                    className="text-lg"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onButtonClick(char)
                                    }}
                                >
                                    {char}
                                </Button>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="vowels">
                        <div className="grid grid-cols-8 gap-1 pt-2">
                            {VOWELS.map(char => (
                                <Button
                                    key={char}
                                    variant="outline"
                                    size="sm"
                                    className="text-lg text-chart-1"
                                     onMouseDown={(e) => {
                                        e.preventDefault();
                                        onButtonClick(char)
                                    }}
                                >
                                    {char}
                                </Button>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

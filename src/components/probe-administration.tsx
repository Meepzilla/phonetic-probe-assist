
'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  ProbeSession,
  ProbeWordResult,
  ErrorType,
  PhonemeProduction,
} from '@/lib/types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  SkipForward,
  Pencil,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { IpaKeyboard } from './ipa-keyboard';
import { handleGenerateImage } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface ProbeAdministrationProps {
  session: ProbeSession;
  currentWordIndex: number;
  setCurrentWordIndex: (index: number) => void;
  updateResult: (index: number, updatedResult: ProbeWordResult) => void;
  onFinish: () => void;
}

export function ProbeAdministration({
  session,
  currentWordIndex,
  setCurrentWordIndex,
  updateResult,
  onFinish,
}: ProbeAdministrationProps) {
  const [currentResult, setCurrentResult] = useState<ProbeWordResult>(
    session.results[currentWordIndex]
  );
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [focusedInputIndex, setFocusedInputIndex] = useState<number | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentResult(session.results[currentWordIndex]);
  }, [currentWordIndex, session.results]);

  const handleProductionChange = (
    index: number,
    field: keyof PhonemeProduction,
    value: any
  ) => {
    const newProductions = [...currentResult.productions];
    const newProduction = { ...newProductions[index], [field]: value };

    // If an error type is selected, automatically mark as incorrect.
    if (field === 'errorType' && value) {
      newProduction.isCorrect = false;
    }

    if (field === 'isCorrect' && value === true) {
      delete newProduction.errorType;
      delete newProduction.errorDetail;
    }

    newProductions[index] = newProduction;

    const newResult: ProbeWordResult = {
      ...currentResult,
      productions: newProductions,
    };
    delete newResult.skipped;
    setCurrentResult(newResult);
  };

  const handleSaveAndNavigate = (direction: 'next' | 'prev') => {
    // Ensure the latest state of currentResult is saved before navigating
    const newResult: ProbeWordResult = { ...currentResult };
    if (newResult.skipped) {
        delete newResult.skipped;
    }
    updateResult(currentWordIndex, newResult);

    if (direction === 'next') {
        if (currentWordIndex < session.wordList.length - 1) {
            setCurrentWordIndex(currentWordIndex + 1);
        }
    } else {
        if (currentWordIndex > 0) {
            setCurrentWordIndex(currentWordIndex - 1);
        }
    }
};

  const handleSkip = () => {
    const newResult = {
      ...currentResult,
      skipped: true,
      productions: currentResult.phonemes.map(unit => ({ isCorrect: false, ipa: unit.phoneme, errorType: 'omission' })),
    };
    updateResult(currentWordIndex, newResult);

    if (currentWordIndex < session.wordList.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleFinish = () => {
    const newResult: ProbeWordResult = { ...currentResult };
    if (newResult.skipped) {
        delete newResult.skipped;
    }
    updateResult(currentWordIndex, newResult);
    onFinish();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const newResult = {
            ...currentResult,
            imageUrl: reader.result as string,
          };
          setCurrentResult(newResult);
          updateResult(currentWordIndex, newResult);
          setIsImageModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onGenerateImage = async () => {
    startTransition(async () => {
      const result = await handleGenerateImage({ word: currentResult.word });
      if (result?.imageUrl) {
        const newResult = {
          ...currentResult,
          imageUrl: result.imageUrl,
        };
        setCurrentResult(newResult);
        updateResult(currentWordIndex, newResult);
        setIsImageModalOpen(false);
        toast({
          title: 'Image Generated!',
          description: `A new image for "${currentResult.word}" has been created.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result?.message || 'Could not generate image. Please try again.',
        });
      }
    });
  };

    const handleIpaButtonClick = (char: string) => {
        if (focusedInputIndex === null) return;
        const currentIpa = currentResult.productions[focusedInputIndex].ipa;
        handleProductionChange(focusedInputIndex, 'ipa', currentIpa + char);
    };

  const progress = ((currentWordIndex + 1) / session.wordList.length) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Probe: Word {currentWordIndex + 1} of {session.wordList.length}
            </CardTitle>
            <CardDescription>{session.clientId}</CardDescription>
          </div>
          {currentResult.category && (
            <CardDescription className="pt-1">
              <span className="font-semibold">{currentResult.category}</span>
              {currentResult.subCategory && ` - ${currentResult.subCategory}`}
            </CardDescription>
          )}
          <Progress value={progress} className="w-full mt-2" />
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col items-center justify-start space-y-4">
            <div className="relative">
              <Image
                src={currentResult.imageUrl || `https://placehold.co/400x300.png?text=${currentResult.word}`}
                alt={currentResult.word}
                width={400}
                height={300}
                className="rounded-lg shadow-md object-cover"
                data-ai-hint={currentResult.word}
              />
               <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute top-2 right-2 bg-background/70 hover:bg-background">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit Image</span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Image for "{currentResult.word}"</DialogTitle>
                        <DialogDescription>
                            Upload your own image or generate a new one using AI.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                         <div className="space-y-2">
                            <Label htmlFor="image-upload">Upload From Device</Label>
                            <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
                        </div>
                        <div className="relative">
                           <div className="absolute inset-0 flex items-center">
                               <span className="w-full border-t" />
                           </div>
                           <div className="relative flex justify-center text-xs uppercase">
                               <span className="bg-background px-2 text-muted-foreground">Or</span>
                           </div>
                        </div>
                        <div className="space-y-2">
                             <Label>Generate with AI</Label>
                              <Button onClick={onGenerateImage} disabled={isGenerating} className="w-full">
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Generate Child-Friendly Image
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            </div>
            <div className="text-center">
              <h2 className="text-5xl font-bold font-headline">
                {currentResult.word.split('').map((char, index) => (
                  <span key={index} className={cn({'text-chart-1': 'aeiou'.includes(char.toLowerCase())})}>
                    {char}
                  </span>
                ))}
              </h2>
              {currentResult.skipped && (
                <Badge variant="outline" className="mt-2">
                  Skipped
                </Badge>
              )}
            </div>
            <div className="flex justify-center items-center gap-4 pt-4 w-full">
              <Button
                variant="outline"
                onClick={() => handleSaveAndNavigate('prev')}
                disabled={currentWordIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>

              <Button variant="secondary" onClick={handleSkip}>
                <SkipForward className="mr-2 h-4 w-4" /> Skip
              </Button>

              {currentWordIndex === session.wordList.length - 1 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <CheckCircle className="mr-2 h-4 w-4" /> Finish
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to finish?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will finalize the probe and move to the results
                        view. You can come back to this step later if needed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleFinish}>
                        Finish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button onClick={() => handleSaveAndNavigate('next')}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Phoneme Production</h3>
            <ScrollArea className="h-[400px] rounded-md border">
              {/* Mobile View */}
              <div className="md:hidden p-2 space-y-4">
                {currentResult.phonemes.map((unit, index) => {
                  const prod = currentResult.productions[index];
                  if (!unit || !prod) return null;

                  return (
                    <div
                      key={`${unit.position}-${unit.phoneme}-${index}`}
                      className="p-3 border rounded-lg bg-card shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium capitalize">{unit.position}</p>
                        <p className={cn("text-muted-foreground text-2xl font-semibold font-body", { "text-chart-1": unit.type === 'vowel'})}>
                          /{unit.phoneme}/
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-grow space-y-1">
                          <Label
                            htmlFor={`${unit.position}-${index}-ipa-mobile`}
                            className="sr-only"
                          >
                            IPA Transcription
                          </Label>
                          <Input
                            id={`${unit.position}-${index}-ipa-mobile`}
                            value={prod.ipa}
                            onChange={(e) =>
                              handleProductionChange(index, 'ipa', e.target.value)
                            }
                            onFocus={() => setFocusedInputIndex(index)}
                            onBlur={() => setFocusedInputIndex(null)}
                            className="text-lg font-body w-32"
                          />
                        </div>
                        <div className="flex-shrink-0">
                          <RadioGroup
                            value={prod.isCorrect ? 'correct' : 'error'}
                            onValueChange={(val) =>
                              handleProductionChange(
                                index,
                                'isCorrect',
                                val === 'correct'
                              )
                            }
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="correct"
                                id={`${unit.position}-${index}-correct-mobile`}
                              />
                              <Label
                                htmlFor={`${unit.position}-${index}-correct-mobile`}
                              >
                                Correct
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="error"
                                id={`${unit.position}-${index}-error-mobile`}
                              />
                              <Label
                                htmlFor={`${unit.position}-${index}-error-mobile`}
                              >
                                Error
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>

                      {!prod.isCorrect && (
                        <div className="space-y-2">
                          <Select
                            value={prod.errorType}
                            onValueChange={(val: ErrorType) =>
                              handleProductionChange(index, 'errorType', val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select error type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="substitution">
                                Substitution
                              </SelectItem>
                              <SelectItem value="omission">Omission</SelectItem>
                              <SelectItem value="distortion">
                                Distortion
                              </SelectItem>
                              <SelectItem value="addition">Addition</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={prod.errorDetail || ''}
                            onChange={(e) =>
                              handleProductionChange(
                                index,
                                'errorDetail',
                                e.target.value
                              )
                            }
                            placeholder="Error details (e.g., t for k)"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Phoneme</TableHead>
                      <TableHead>Production</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentResult.phonemes.map((unit, index) => {
                      const prod = currentResult.productions[index];
                      if (!unit || !prod) return null;

                      return (
                        <TableRow
                          key={`${unit.position}-${unit.phoneme}-${index}`}
                        >
                          <TableCell className="capitalize">
                            <p className="font-medium">{unit.position}</p>
                          </TableCell>
                          <TableCell>
                            <p className={cn("text-muted-foreground text-2xl font-semibold font-body", { "text-chart-1": unit.type === 'vowel'})}>
                              /{unit.phoneme}/
                            </p>
                          </TableCell>
                          <TableCell>
                            <Label
                              htmlFor={`${unit.position}-${index}-ipa-desktop`}
                              className="sr-only"
                            >
                              IPA Transcription
                            </Label>
                            <Input
                              id={`${unit.position}-${index}-ipa-desktop`}
                              value={prod.ipa}
                              onChange={(e) =>
                                handleProductionChange(
                                  index,
                                  'ipa',
                                  e.target.value
                                )
                              }
                              onFocus={() => setFocusedInputIndex(index)}
                              onBlur={() => setFocusedInputIndex(null)}
                              className="text-lg font-body"
                            />
                          </TableCell>
                          <TableCell>
                            <RadioGroup
                              value={prod.isCorrect ? 'correct' : 'error'}
                              onValueChange={(val) =>
                                handleProductionChange(
                                  index,
                                  'isCorrect',
                                  val === 'correct'
                                )
                              }
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="correct"
                                  id={`${unit.position}-${index}-correct-desktop`}
                                />
                                <Label
                                  htmlFor={`${unit.position}-${index}-correct-desktop`}
                                >
                                  Correct
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="error"
                                  id={`${unit.position}-${index}-error-desktop`}
                                />
                                <Label
                                  htmlFor={`${unit.position}-${index}-error-desktop`}
                                >
                                  Error
                                </Label>
                              </div>
                            </RadioGroup>
                            {!prod.isCorrect && (
                              <div className="mt-2 space-y-2">
                                <Select
                                  value={prod.errorType}
                                  onValueChange={(val: ErrorType) =>
                                    handleProductionChange(
                                      index,
                                      'errorType',
                                      val
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select error type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="substitution">
                                      Substitution
                                    </SelectItem>
                                    <SelectItem value="omission">
                                      Omission
                                    </SelectItem>
                                    <SelectItem value="distortion">
                                      Distortion
                                    </SelectItem>
                                    <SelectItem value="addition">
                                      Addition
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={prod.errorDetail || ''}
                                  onChange={(e) =>
                                    handleProductionChange(
                                      index,
                                      'errorDetail',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Error details (e.g., t for k)"
                                />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
             <IpaKeyboard onButtonClick={handleIpaButtonClick} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

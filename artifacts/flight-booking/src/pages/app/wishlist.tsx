import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plane, ArrowRight, MapPin, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useListWishlist, useDeleteWishlistItem, getListWishlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Wishlist() {
  const { data: wishlist, isLoading } = useListWishlist();
  const deleteItem = useDeleteWishlistItem();
  const queryClient = useQueryClient();

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteItem.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListWishlistQueryKey() });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-accent fill-accent/20" />
          <h1 className="text-3xl font-serif font-bold text-foreground">My Wishlist</h1>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-card animate-pulse rounded-xl border border-border" />)}
          </div>
        ) : wishlist && wishlist.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {wishlist.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/app/flights/${item.flight.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer group border-border overflow-hidden">
                    <div className="bg-primary/5 px-6 py-3 flex justify-between items-center border-b border-border/40">
                       <span className="text-sm font-medium text-foreground flex items-center gap-2">
                         <Plane className="h-4 w-4 text-primary" /> {item.flight.airlineName}
                       </span>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                         onClick={(e) => handleRemove(e, item.id)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{item.flight.departure}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{item.flight.arrival}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end mt-6">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Departure</p>
                          <p className="font-semibold text-foreground">{format(new Date(item.flight.departureTime), "MMM dd, yyyy")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">From</p>
                          <p className="text-2xl font-bold text-primary">${item.flight.basePrice}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-dashed border-border rounded-xl p-16 text-center max-w-2xl mx-auto mt-12">
            <div className="h-20 w-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-2xl font-serif font-medium text-foreground mb-3">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Save flights you're interested in by clicking the heart icon on any flight details page.
            </p>
            <Button size="lg" asChild>
              <Link href="/app/search">Discover Flights</Link>
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

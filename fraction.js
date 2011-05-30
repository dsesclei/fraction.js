/*

fraction.js
A Javascript fraction library.

Copyright ( c ) 2009	Erik Garrison <erik@hypervolu.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files ( the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

Fraction = function( numerator, denominator, simplify )
{
	this.simplify = ( typeof simplify === 'undefined' ) ? true : simplify;

	/* double argument invocation */
	if ( numerator && denominator ) {
		if ( typeof( numerator ) === 'number' && typeof( denominator ) === 'number' ) {
			this.numerator = numerator;
			this.denominator = denominator;
		} else if ( typeof( numerator ) === 'string' && typeof( denominator ) === 'string' ) {
			// what are they?
			// hmm....
			// assume they are ints?
			this.numerator = parseInt( numerator, 10 );
			this.denominator = parseInt( denominator, 10 );
		}
		/* single-argument invocation */
	} else if ( !denominator ) {
		
		// swap variable names for legibility
		num = numerator;
		if ( typeof( num ) === 'number' ) {
			// just a straight number init
			this.numerator = num;
			this.denominator = 1;
		} else if ( typeof( num ) === 'string' ) {
			// hold the first and second part of the fraction, e.g. a = '1' and b = '2/3' in 1 2/3
			var a, b;

			// or a = '2/3' and b = undefined if we are just passed a single-part number
			[ a, b ] = num.split( ' ' );

			/* compound fraction e.g. 'A B/C' */
			// if a is an integer ...
			if ( a % 1 === 0 && b && b.match( '/' ) ) {
				return ( new Fraction( a ) ).add( new Fraction( b ) );
			} else if ( a && !b ) {
				/* simple fraction e.g. 'A/B' */
				if ( typeof( a ) === 'string' && a.match( '/' ) ) {
					// it's not a whole number... it's actually a fraction without a whole part written
					var f = a.split( '/' );
					this.numerator = f[0]; this.denominator = f[ 1 ];
					/* string floating point */
				} else if ( typeof( a ) === 'string' && a.match( '\.' ) ) {
					return new Fraction( parseFloat( a ) );
					/* whole number e.g. 'A' */
				} else {
					// just passed a whole number as a string
					this.numerator = parseInt( a, 10 );
					this.denominator = 1;
				}
			} else {
				// could not parse
				return undefined;
			}
		}
	}
	this.normalize();
};

Fraction.prototype.clone = function()
{
	return new Fraction( this.numerator, this.denominator );
};

/* pretty-printer, converts fractions into whole numbers and fractions */
Fraction.prototype.toString = function(mixed)
{
	mixed = ( typeof mixed === 'undefined' ) ? false : mixed;

	if ( mixed ) {
		var wholepart = Math.floor( this.numerator / this.denominator );
		var numerator = this.numerator % this.denominator;
		var denominator = this.denominator;
		var result = [];

		if ( wholepart !== 0 ) {
			result.push( wholepart );
		}

		if ( numerator !== 0 ) {
			result.push( numerator + '/' + denominator );
		}

		return result.length > 0 ? result.join( ' ' ) : 0;
	} else {
		return this.numerator + '/' + this.denominator;
	}
};

/* destructively rescale the fraction by some integral factor */
Fraction.prototype.rescale = function( factor )
{
	this.numerator *= factor;
	this.denominator *= factor;
	return this;
};

Fraction.prototype.add = function( b )
{
	var a = this.clone();
	if ( b instanceof Fraction ) {
		b = b.clone();
	} else {
		b = new Fraction( b );
	}
	td = a.denominator;
	a.rescale( b.denominator );
	b.rescale( td );

	a.numerator += b.numerator;

	return a.normalize();
};

Fraction.prototype.subtract = function( b )
{
	var a = this.clone();
	if ( b instanceof Fraction ) {
		// we scale our argument destructively, so clone
		b = b.clone();
	} else {
		b = new Fraction( b );
	}
	td = a.denominator;
	a.rescale( b.denominator );
	b.rescale( td );

	a.numerator -= b.numerator;

	return a.normalize();
};

Fraction.prototype.multiply = function( b )
{
	var a = this.clone();
	if ( b instanceof Fraction )
		{
			a.numerator *= b.numerator;
			a.denominator *= b.denominator;
		} else if ( typeof b === 'number' ) {
			a.numerator *= b;
		} else {
			return a.multiply( new Fraction( b ) );
		}
		return a.normalize();
};

Fraction.prototype.divide = function( b )
{
	var a = this.clone();
	if ( b instanceof Fraction )
		{
			a.numerator *= b.denominator;
			a.denominator *= b.numerator;
		} else if ( typeof b === 'number' ) {
			a.denominator *= b;
		} else {
			return a.divide( new Fraction( b ) );
		}
		return a.normalize();
};

Fraction.prototype.equals = function( b )
{
	if ( !( b instanceof Fraction ) ) {
		b = new Fraction( b );
	}

	// fractions that are equal should have equal normalized forms
	var c = this.clone().normalize();
	var d = b.clone().normalize();
	return ( c.numerator === d.numerator && c.denominator === d.denominator );
};


/* Utility functions */

/* Destructively normalize the fraction to its smallest representation. 
* e.g. 4/16 -> 1/4, 14/28 -> 1/2, etc.
* This is called after all math ops.
*/
Fraction.prototype.normalize = ( function()
{
	var isFloat = function( n ) {
		return ( typeof( n ) === 'number' && 
						( ( n > 0 && n % 1 > 0 && n % 1 < 1 ) || 
						n < 0 && n % -1 < 0 && n % -1 > -1 ) );
	};

	var roundToPlaces = function( n, places ) {
		if ( !places ) {
			return Math.round( n );
		} else {
			var scalar = Math.pow( 10, places );
			return Math.round( n * scalar ) / scalar;
		}
	};
	
	return ( function() {
		// XXX hackish.  Is there a better way to address this issue?
		/* first check if we have decimals, and if we do eliminate them
		 * multiply by the 10 ^ number of decimal places in the number
		 * round the number to nine decimal places
		 * to avoid js floating point funnies
		 */

		if ( this.simplify === true ) {
			if ( isFloat( this.denominator ) ) {
				var rounded = roundToPlaces( this.denominator, 9 );
				var scaleup = Math.pow( 10, rounded.toString().split( '.' )[ 1 ].length );
				this.denominator = Math.round( this.denominator * scaleup ); // this !!! should be a whole number
				//this.numerator *= scaleup;
				this.numerator *= scaleup;
			}

			if ( isFloat( this.numerator ) ) {
				var rounded = roundToPlaces( this.numerator, 9 );
				var scaleup = Math.pow( 10, rounded.toString().split( '.' )[ 1 ].length );
				this.numerator = Math.round( this.numerator * scaleup ); // this !!! should be a whole number
				//this.numerator *= scaleup;
				this.denominator *= scaleup;
			}

			var gcf = Fraction.gcf( this.numerator, this.denominator );
			this.numerator /= gcf;
			this.denominator /= gcf;
			return this;
		} else {
			return this;
		}
	});

})();

/* Takes two numbers and returns their greatest common factor. */
Fraction.gcf = function( a, b )
{
	var common_factors = [];
	var fa = Fraction.primeFactors( a );
	var fb = Fraction.primeFactors( b );

	// for each factor in fa
	// if it's also in fb
	// put it into the common factors
	fa.forEach( function ( factor ) { 
		var i = fb.indexOf( factor );
		if ( i >= 0 ) {
			common_factors.push( factor );
			
			// remove from fb
			fb.splice( i, 1 );
		}
	});

	if ( common_factors.length === 0 ) {
		return 1;
	}

	var gcf = ( function() {
		var r = common_factors[ 0 ];
		var i;

		for ( i = 1; i < common_factors.length; i++ ) {
			r = r * common_factors[i];
		}
		
		return r;
	})();
	
	return gcf;
};

Fraction.compare = function( f_a, f_b ) {
	var a, b;

	// Convert both parameters to integers, if they are fractions
	if ( typeof( f_a ) instanceof Fraction ) {
		a = parseFloat( f_a.numerator ) / parseFloat( f_a.denominator );
	} else {
		a = f_a;
	}

	if ( typeof( f_b ) instanceof Fraction ) {
		b = parseFloat( f_b.numerator ) / parseFloat( f_b.denominator );
	} else {
		b = f_b;
	}

	if ( a < b ) {
		return -1;
	}

	if ( a === b ) {
		return 0;
	}

	if ( a > b ) {
		return 1;
	}
};

// Adapted from:
// http://www.btinternet.com/~se16/js/factor.htm
Fraction.primeFactors = function( n ) 
{
	var num = n;
	var factors = [];

	// first potential prime factor
	var _factor = 2;
	
	// should we keep looking for factors?
	while ( _factor * _factor <= num ) {

		// this is a factor
		if ( num % _factor === 0 ) {
			// and increment
			factors.push( _factor );

			// and divide our search point by it
			num = num / _factor;
		} else {
			 // and increment
			_factor++;
		}
	}
	
	// If there is anything left at the end...
	if ( num !== 1 ) {
		// ...this must be the last prime factor
		// so it too should be recorded
		factors.push( num );
	}

	// Return the prime factors
	return factors;
};
